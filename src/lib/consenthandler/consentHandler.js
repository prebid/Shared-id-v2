import {createProxy} from "./proxy/proxyFactory";

export default class ConsentHandler{
    constructor(option = {}){
        this.config = {
            timeout: 1000,
            alwaysCallback: true,
            type: 'iab'
        };
        Object.assign(this.config, option);
        if (this.config.type === 'iab') {
            this.proxy = createProxy();
            if (this.proxy) {
                this.proxy.fetchConsentData();
            }
        }
    }

    /**
     * Main function called by clients to get the consent data
     * @param callback
     */
    checkConsent(callback){
        if(this.proxy){
            this.proxy.getConsent((result, success) => {
                if (success) {
                    callback(result, true);
                } else if (this.config.alwaysCallback) {
                    callback(result, false)
                }
            }, this.config.timeout);
        }
        else{
            const empty = {gdpr: null, gdpr_consent: null};
            callback(empty, true);
        }
    }

    /**
     * test if we should be calling to get the gdpr data
     * @returns {boolean}
     */
    consentEnabled(){
        return !!this.proxy;
    }

    /**
     * Test whether the publisher site has consent to access privacy data
     * @param callback
     */
    hasSiteConsent(callback){
        this.checkConsent((consent,success)=>{
            let hasConsent = false;
            if(success){
                hasConsent = consent.hasSiteConsent;
            }
            callback(hasConsent, success);
        })
    }
}
