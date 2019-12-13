import Tcf from "./tcf";
import {FrameProxy} from "./frameProxy";
import {findCmpFrame, sendCmpRequests} from "./utils";
import Cmp from "./cmp";

/**
 * Helper to determine GDPR consents.
 *
 * If consentConfig.type is 'iab', then it will attempt to call cmp in the following order:
 *  1. Cmp in the same frame, or top frame.
 *  2. If safe frame is used, then call cmp thru safe frame.
 *  3. Look for a cmp frame and call cmp thru messages.
 *
 * If consentConfig.type is 'static', then the driver data is expected to be supplied in
 * driver.consentData.  Usually this means the caller has managed to call cmp on its own.
 */
export default class ConsentHandler {
    constructor(options = {}) {
        this.config = {
            type: '',
            timeout: 1000,
            alwaysCallback: true
        };

        Object.assign(this.config, options);
        const enabled = (this.config.type === 'iab' || this.config.type === 'static');

        if(enabled) {
            [this.driver, this.cmpProxy] = this.getProxy();
        }
    }

    getProxy() {
        let driver,proxy;
        driver = new Tcf();
        proxy = this.createProxy(driver);
        if (!proxy) {
            driver = new Cmp();
            proxy = this.createProxy(driver);
        }
        return [driver,proxy];
    }

    createProxy(driver){
        let fCmp;
        let proxy;
        try{
            fCmp = window[driver.cmpApi] || window.top[driver.cmpApi];
        }
        catch (e) {
            // noop
        }

        if (typeof fCmp === 'function') {
            proxy = fCmp;
        }
        else if (window.$sf && window.$sf.ext && window.$sf.ext[driver.safeframeCall]) {
            proxy = this.callSafeFrame;
        }
        else {
            const frame = findCmpFrame(driver.locatorFrame);
            if (frame) {
                const tmp = new FrameProxy(frame, driver);
                proxy = function (cmd,args,callback) {tmp.call(cmd,args,callback);};
            }
        }
        return proxy;
    }

    consentEnabled(){
        return(!!this.cmpProxy);
    }

    /**
     * Calls cmp thru safe frame.
     * @param {string} commandName Name of the cmp request
     * @param arg
     * @param {function} callback Callback function
     */
    callSafeFrame(commandName, arg, callback) {
        function sf_callback(msgName, data) {

            if(msgName === this.driver.returnMsgName){
                let response = data;
                if(this.driver.getSafeFrameData){
                    response = this.driver.getSafeFrameData(data);
                }
                callback(response, data.success);
            }
        }

        window.$sf.ext.register(300, 250, sf_callback);
        window.$sf.ext[this.driver.safeframeCall](commandName);
    }

    getConsent(callback, timeout){
        sendCmpRequests(this.cmpProxy, this.driver.getConsentCmd(), (result, success)=>{
            if(typeof callback == 'function'){
                if(success){
                    const consentData = this.driver.getConsentData(result);
                    callback(consentData, success);
                }
                else{
                    callback(result, success);
                }
            }
        }, timeout);
    }

    /**
     * Entry point to determine driver.
     * @param {function} callback Function to call after driver has been determined
     */
    checkConsent(callback) {
        if(this.cmpProxy) {
            this.getConsent((result, success) => {
                if (success) {
                    callback(result, true);
                } else if (this.config.alwaysCallback) {
                    callback(result, false);
                }

            }, this.config.timeout);
        }
        else{
            const empty = {gdpr: null, gdpr_consent: null, hasSiteConsent: true};
            callback(empty, true);
        }
    }

    /**
     * Determine if we have consent
     */
    hasSiteConsent(callback){
        this.checkConsent( (consent, success) => {
            let hasConsent = false;
            if(success){
                hasConsent = consent.hasSiteConsent;
            }
            callback(hasConsent, success);
        });
    }
}
