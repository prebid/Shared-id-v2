import {isCookieSupported} from './cookieUtils';
import {addQueryParam, copyOptions, firePixel, uuid4} from './utils';
import {deleteValue, extractDomain, isStorageSupported, readValue, writeValue} from './storageUtils';
import ConsentHandler from "./consenthandler/consentHandler";
import {COOKIE, LOCAL_STORAGE} from './constants';

/**
 * Helper to retrieve pubcid (aka: fpc)
 */
export default class PubcidHandler {

    constructor(options = {}) {
        this.config = {
            name: '_pubcid',
            optoutName: '_pubcid_optout',
            expInterval: 525600, // 1 year in minutes
            create: true,
            cookieDomain: undefined,
            type: 'html5,cookie',
            extend: true,
            pixelUrl: '',
            consent: {
                type: 'iab',
                alwaysCallback: true
            }
        };

        copyOptions(this.config, options);

        this.cachedDomain = undefined;
        this.typeEnabled = null;

        if (typeof this.config.type === 'string') {
            const typeArray = this.config.type.split(',');
            for (let i = 0; i < typeArray.length; ++i) {
                const name = typeArray[i].trim();
                if (name === COOKIE) {
                    if (isCookieSupported()) {
                        this.typeEnabled = COOKIE;
                        break;
                    }
                } else if (name === LOCAL_STORAGE) {
                    if (isStorageSupported()) {
                        this.typeEnabled = LOCAL_STORAGE;
                        break;
                    }
                }
            }
        }
    }

    /**
     * Check whether there is consent to access pubcid
     * @returns {boolean} true if there is consent
     */
    hasConsent(callback) {
        const {optoutName} = this.config;
        let consentHandler = new ConsentHandler(this.config.consent);

        if (optoutName) {
            const optout = readValue(COOKIE, optoutName) || readValue(LOCAL_STORAGE, optoutName);
            if (optout) {
                callback(false);
                return;
            }
        }

        if (consentHandler.consentEnabled()) {
            consentHandler.hasStorageConsent(callback);
        } else {
            callback(true);
        }
    }

    /**
     * Retrieve pubcid.  Create it if it's not already there.  Note that this may return a
     * null even if a pubcid is created due to async nature of the consent checks.
     * @deprecated
     * @returns {string} pubcid if exist.  Null otherwise.
     */
    fetchPubcid() {
        this.updatePubcidWithConsent();
        return this.readPubcid();
    }

    /**
     * Create/Extend pubcid if there is consent.  Delete pubcid if there isn't.
     * @param {function} [callback] This function is passed pubcid value after consent check.
     */
    updatePubcidWithConsent(callback) {
        this.hasConsent((consent) => {
            let pubcid = null;
            if (consent) {
                this.createPubcid();
                pubcid = this.readPubcid();
            } else {
                this.deletePubcid();
            }
            if (typeof callback === 'function')
                callback(pubcid);
        });
    }

    /**
     * Retrieve pubcid if there is consent.  Otherwise returns null.
     * @param {function} callback This function is passed pubcid value after consent check.
     */
    readPubcidWithConsent(callback) {
        this.hasConsent((consent) => {
            const pubcid = consent ? this.readPubcid() : null;
            if (typeof callback === 'function')
                callback(pubcid);
        });
    }

    /**
     * Fetch a image pixel asynchronously if pixelUrl is defined.  This enables
     * server side to update the pubcid cookie if needed.
     * @param {string} id ID
     */
    getPixel(id = '') {
        if (this.config.pixelUrl) {
            let targetUrl = addQueryParam(this.config.pixelUrl, 'id', 'pubcid:' + id);
            firePixel(targetUrl);
        }
    }

    /**
     * Create a new pubcid if it doesn't exist already.
     */
    createPubcid() {
        const {name, create, expInterval, extend, pixelUrl} = this.config;
        let pubcid = readValue(this.typeEnabled, this.config.name);

        if (!pubcid) {
            if (create) {
                if (this.typeEnabled === LOCAL_STORAGE)
                    pubcid = readValue(COOKIE, name);
                if (!pubcid)
                    pubcid = uuid4();

                writeValue(this.typeEnabled, name, pubcid, expInterval, this.getDomain(this.typeEnabled));
            }
            this.getPixel(pubcid);
        } else if (extend) {
            if (pixelUrl)
                this.getPixel(pubcid);
            else {
                writeValue(this.typeEnabled, name, pubcid, expInterval, this.getDomain(this.typeEnabled));
            }
        }
    }

    /**
     * Delete pubcid
     * @param {boolean} all If true, then delete pubcid from all storage types
     */
    deletePubcid({all = true} = {}) {
        const {name} = this.config;
        if (all || this.typeEnabled == COOKIE) {
            //Don't call getDomain as it may write out temp cookies so copy getDomain functionality here
            if (this.config.cookieDomain !== undefined) {
                deleteValue(COOKIE, name, this.config.cookieDomain);
            } else if (this.cachedDomain !== undefined) {
                deleteValue(COOKIE, name, this.cachedDomain);
            } else {
                //Just attempt to delete any cookie matching name and domain, don't care about success
                const parts = this.getHostname().split('.');
                for (let i = 0, len = parts.length; i < len; ++i) {
                    const currDomain = parts.slice(i).join('.');
                    deleteValue(COOKIE, name, currDomain);
                }
            }
        }

        if (all || this.typeEnabled == LOCAL_STORAGE) {
            deleteValue(LOCAL_STORAGE, name, ''); //domain doesn't do anything for LOCAL_STORAGE
        }
    }

    /**
     * Return existing pubcid
     * @param {boolean} any If true, then check all storage and return the first one
     * @returns {string|null} pubcid if it exists.
     */
    readPubcid({any = true} = {}) {
        const name = this.config.name;
        return any ? readValue(COOKIE, name) || readValue(LOCAL_STORAGE, name) : readValue(this.typeEnabled, name);
    }

    /**
     * Get the domain for writing/deleting cookies.  This can either be the cookieDomain defined in the
     * config, or calculated dynamically by writing test cookies.
     *
     * @param {string} [type] Storage type.  Any type besides COOKIE will get undefined as result.
     *  Local storage doesn't need specify domain.
     * @returns {string|any}
     */
    getDomain(type = COOKIE) {
        if (type === COOKIE) {
            if (this.config.cookieDomain !== undefined) {
                return this.config.cookieDomain;
            }
            else if (this.cachedDomain !== undefined) {
                return this.cachedDomain
            }
            else {
                this.cachedDomain = extractDomain(this.getHostname());
                return this.cachedDomain;
            }
        }
    }

    /**
     * Wrapper for global value of document.location.hostname
     * allows for easier unit testing to mock hostname.
     * @returns {String} document.location.hostname
     */
    getHostname(){
        return document.location.hostname;
    }
}
