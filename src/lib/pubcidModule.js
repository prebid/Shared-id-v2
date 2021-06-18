import PubcidHandler from './pubcidHandler';
import {uuid4} from './utils';
import log from 'loglevel'

/**
 * Create a window level PublisherCommonId object that sets and returns pubcid.
 * @param {Window} win window object
 * @param {Document} doc document object
 * @param {object} options Additional options.
 */
export function setupPubcid(win, doc, options = {}) {

    const name = 'PublisherCommonId';
    const delegate = win[name] || {};
    delegate.que = delegate.que || [];

    /**
     * Process one of the queued commands.  This is also mapped to PublisherCommonId.que.push.
     * @param {Object[] | function} args An array or a function.  If it's an array, then the first item is the method
     * name, followed by parameters.
     */
    function processQueue(args) {
        if (typeof args !== 'function') {
            const params = [].slice.call(args);  // convert to a proper array
            const method = params.shift();       // separate method name from the rest
            if (typeof delegate[method] === 'function') {
                log.debug(`Processing command: ${method}`)
                delegate[method].apply(delegate, params);
            }
            else {
                log.warn(`Skipped unrecognized command: ${method}`);
            }
        } else {
            log.debug('Processing anonymous function');
            args();
        }
    }

    const _handler = new PubcidHandler(options);

    /* --- synchronous methods --- */

    /**
     * Return the pubcid currently stored.  This does not check consent again
     * and rely on the check that occurs during module initialization.
     * @returns {string} pubcid as a string
     */
    delegate.getId = function() {
        return _handler.readPubcid() || '';
    };

    /**
     * Create or refresh pubcid in cookie/local storage if there is consent,
     * otherwise delete the pubcid.
     */
    delegate.init = function() {
        _handler.updatePubcidWithConsent();
    };

    /**
     * Create and store a pubcid in cookie/local storage.  The caller is responsible for
     * checking consent.
     */
    delegate.createId = function() {
        _handler.createPubcid();
    };

    /**
     * Delete pubcid from cookie/local storage
     */
    delegate.deleteId = function() {
        _handler.deletePubcid();
    };

    /**
     * Generate a pubcid without storing it.  Since it's not stored, each call returns a
     * different value.
     * @returns {string} pubcid as a string
     */
    delegate.generateId = function() {
        return uuid4();
    };

    /* --- asynchronous methods --- */

    /**
     * Create or refresh pubcid in cookie/local storage if there is consent and
     * pass the pubcid to the callback.  If there is no consent, then pubcid is deleted
     * and a null is passed to the callback.
     * @param {function} callback
     */
    delegate.updateIdWithConsent = function(callback) {
        _handler.updatePubcidWithConsent(callback);
    };

    /**
     * Return the pubcid via the callback if there is consent.  Otherwise
     * pass null to the callback.
     * @param {function} callback
     */
    delegate.getIdWithConsent = function(callback) {
        _handler.readPubcidWithConsent(callback);
    };

    /* --- Queue and global object initialization --- */

    if (options.autoinit === undefined || options.autoinit)
        delegate.init();

    delegate.que.forEach((args) => {
        processQueue(args);
    });

    delegate.que.push = processQueue;   // Intercept array push
    win[name] = delegate;               // Assign delegate to window.PublisherCommonId
}
