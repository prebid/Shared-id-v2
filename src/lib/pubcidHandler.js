import {getCookie, isCookieSupported, setCookie, delCookie} from './cookieUtils';
import {uuid4, addQueryParam, firePixel, copyOptions} from './utils';
import {getStorageItem, isStorageSupported, setStorageItem, removeStorageItem} from './storageUtils';
import ConsentHandler from "./consenthandler/consentHandler";

const COOKIE = 'cookie';
const LOCAL_STORAGE = 'html5';

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
            cookieDomain: '',
            type: 'html5,cookie',
            extend: true,
            pixelUrl: '',
            consent: {
                type: 'iab',
                alwaysCallback: true
            }
        };

        copyOptions(this.config, options);

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
                }
                else if (name === LOCAL_STORAGE) {
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
            const optout = this.readValue(optoutName, COOKIE) || this.readValue(optoutName, LOCAL_STORAGE);
            if (optout) {
                callback(false);
                return;
            }
        }

        if(consentHandler.consentEnabled()){
            consentHandler.hasSiteConsent((consent, success) =>{
                callback(consent, success);
            });
        }
        else {
            callback(true);
        }
    }

    /**
     * Read a value by checking cookies first and then local storage.
     * @param {string} name Name of the item
     * @param {string} type Override of type
     * @returns {string|null} a string if item exists
     */
    readValue(name, type) {
        let value;
        if (!type)
            type = this.typeEnabled;

        if (type === COOKIE) {
            value = getCookie(name);
        }
        else if (type === LOCAL_STORAGE) {
            value = getStorageItem(name);
        }

        if (value === 'undefined' || value === 'null')
            return null;

        return value;
    }

    /**
     * Write a value to cookies or local storage
     * @param {string} name Name of the item
     * @param {string} value Value to be stored
     * @param {number} expInterval Expiry time in minutes
     * @param {string} domain Cookie cookieDomain
     */
    writeValue(name, value, expInterval, domain) {
        if (name && value) {
            if (this.typeEnabled === COOKIE) {
                setCookie(name, value, expInterval, domain, '/', 'Lax');
            }
            else if (this.typeEnabled === LOCAL_STORAGE) {
                setStorageItem(name, value, expInterval);
            }
        }
    }

    /**
     * Delete value from cookies or local storage
     * @param {string} name Name of the item
     */
    deleteValue(name) {
        if (name) {
            if (this.typeEnabled === COOKIE) {
                delCookie(name);
            }
            else if (this.typeEnabled === LOCAL_STORAGE) {
                removeStorageItem(name);
            }
        }
    }

    /**
     * Retrieve pubcid.  Create it if it's not already there.
     * @returns {string} pubcid if exist.  Null otherwise.
     */
    fetchPubcid() {
        this.updatePubcidWithConsent();
        return this.readPubcid();
    }

    /**
     * Create/Extend pubcid if there is consent.  Delete pubcid if there isn't.
     */
    updatePubcidWithConsent() {
        const handler = this;
        const callback = function(consent){
            if(consent){
                handler.createPubcid();
            } else {
                handler.deletePubcid();
            }
        };
        this.hasConsent(callback);
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
    createPubcid({force = false} = {}) {
        const {name, create, expInterval, cookieDomain, extend, pixelUrl} = this.config;
        let pubcid = this.readValue(this.config.name);

        if (!pubcid) {
            if (create || force) {
                if (this.typeEnabled === LOCAL_STORAGE)
                    pubcid = this.readValue(name, COOKIE);
                if (!pubcid)
                    pubcid = uuid4();
                this.writeValue(name, pubcid, expInterval, cookieDomain);
            }
            this.getPixel(pubcid);
        }
        else if (extend){
            if (pixelUrl)
                this.getPixel(pubcid);
            else
                this.writeValue(name, pubcid, expInterval, cookieDomain);
        }
    }

    /**
     * Delete pubcid
     */
    deletePubcid() {
        this.deleteValue(this.config.name);
    }

    /**
     * Return existing pubcid
     * @param {boolean} any If true, then check all storage and return the first one
     * @returns {string|null} pubcid if it exists.
     */
    readPubcid({any = true} = {}) {
        if (any) {
            return this.readValue(this.config.name, COOKIE) || this.readValue(this.config.name, LOCAL_STORAGE);
        }
        else {
            return this.readValue(this.config.name);
        }
    }
}