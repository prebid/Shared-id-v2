import {createProxy} from "./proxy/proxyFactory";
import log from 'loglevel';

export default class ConsentHandler{
    constructor(option = {}){
        this.config = {
            timeout: 1000,
            alwaysCallback: false,
            type: 'iab'
        };
        Object.assign(this.config, option);
        log.debug('Config', JSON.stringify(this.config));
        if (this.config.type === 'iab') {
            this.proxy = createProxy();
            if (this.proxy) {
                this.proxy.fetchConsentData(this.config.timeout);
            }
        }
    }

    /**
     * Main function called by clients to get the consent data
     * @param callback
     */
    checkConsent(callback){
        if (this.consentEnabled()) {
            if (this.proxy) {
                log.debug('checking Consent');
                this.proxy.getConsent(callback);
            }
            else {
                log.debug('No proxy available for CMP');
                // Cmp required but unable to connect.  Return unsure.
                callback({});
            }
        }
        else {
            log.debug('consent not enabled');
            // Since cmp is not required, return a result that says gdprApplies is false
            callback({ gdprApplies: false });
        }
    }

    /**
     * test if we should be calling to get the gdpr data
     * @returns {boolean}
     */
    consentEnabled(){
        return this.config.type === 'iab';
    }

    /**
     * Test whether the publisher site has consent to access privacy data
     * @param callback
     */
    hasStorageConsent(callback){
        this.checkConsent((consentData)=>{
            let gdprApplies = consentData.gdprApplies;
            if (gdprApplies === undefined) {
                // If alwaysCallback is true, then when gdprApplies is ambiguous, treat it as false
                gdprApplies = !this.config.alwaysCallback;
            }

            if (gdprApplies) {
                callback(consentData.hasStorageAccess);
            }
            else {
                callback(true);
            }
        })
    }
}
