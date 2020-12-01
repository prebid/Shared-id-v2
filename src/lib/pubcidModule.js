import PubcidHandler from './pubcidHandler';
import {uuid4} from "./utils";

/**
 * Create a window level PublisherCommonId object that sets and returns pubcid (aka fpc).
 * @param {Window} w window object
 * @param {Document} d document object
 * @param {object} options Additional options.
 */
export function setupPubcid(w, d, options = {}) {

    const PublisherCommonId = (function() {
        if (typeof w.PublisherCommonId === 'object') {
            return w.PublisherCommonId;
        }
        w.PublisherCommonId = {};
        return w.PublisherCommonId;
    }());

    const _handler = new PubcidHandler(options);

    // function to get the id value
    PublisherCommonId.getId = function() {
        return _handler.readPubcid() || '';
    };

    PublisherCommonId.init = function() {
        _handler.updatePubcidWithConsent();
    };

    PublisherCommonId.createId = function() {
        _handler.createPubcid();
    };

    PublisherCommonId.deleteId = function() {
        _handler.deletePubcid();
    };

    PublisherCommonId.generateId = function() {
        return uuid4();
    };

    if (options.autoinit === undefined || options.autoinit)
        PublisherCommonId.init(options.consentData);
}
