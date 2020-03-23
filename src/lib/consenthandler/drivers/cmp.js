import {BaseCmp} from "./baseCmp";

export const CMP_GET_CONSENT_CMD = "getConsentData";
export const CMP_GET_VENDOR_CMD = "getVendorConsents";
export const CMP_SITE_CONSENT_CMD = "siteHasConsent";
export const CMP_GET_MSG = '__cmpCall';
export const CMP_RETURN_MSG = '__cmpReturn';
export const CMP_FRAME = '__cmpLocator';
export const CMP_API = '__cmp';

export class Cmp extends BaseCmp {
    constructor() {
        super(CMP_API, CMP_RETURN_MSG, CMP_GET_MSG, CMP_FRAME);
        this.cmpData = {};
        this.consentCallbackList = [];
    }

    /**
     * Commands needed to fetch the consent data
     * CMP_GET_CONSENT_CMD gets the consent string
     * CMP_SITE_CONSENT_CMD get the site consent field
     * @returns {[string[], string[]]}
     */
    getConsentCmd(){
        return [[CMP_GET_CONSENT_CMD],[CMP_SITE_CONSENT_CMD]];
    }

    /**
     * maps the fields from the api calls to a common result set
     * @param result
     * @returns {{hasSiteConsent: *, gdpr_consent: *, gdpr: *}}
     */
    getConsentData(result){
        if(!result[0]) result[0] = {};
        return this.formatConsentData(result[0].gdprApplies, result[0].consentData, result[1]);
    }

    /**
     * create the json structure for post requests used by frameProxy
     * @param cmd
     * @param arg
     * @param callId
     * @returns {{"[CMP_GET_MSG]": {callId: *, parameter: *, command: *}}}
     */
    createMsg(cmd,arg,callId){
        return ({[CMP_GET_MSG]: {command: cmd, parameter: arg, callId: callId}});
    }

    /**
     * direct api call used by LocalProxy
     * @param fCmp
     * @param cmd
     * @param callback
     * @param args
     */
    callCmp(fCmp, cmd, callback, args) {
        fCmp(cmd, args, callback);
    }

    /**
     * command used to fetch the data when the driver is first created
     * @returns {[[string]]}
     */
    getListenerCmd(){
        return [[CMP_GET_CONSENT_CMD]];
    }

    /**
     * cleanup function after the initial setup is done not used by cmp
     */
    getRmListenerCmd(){}

    /**
     * Once we get the consent data back if there is anyone waiting for the data run their callbacks now
     * with the new data
     * @param result
     * @param success
     */
    fetchDataCallback(result, success){
        this.cmpSuccess = success;
        this.cmpData = this.getConsentData(result);
        this.consentCallbackList.forEach((callback)=>{
            callback(this.cmpData, success);
        });
    }

    /**
     * Main function used by callers to get the consent data.  If the data is available return it now,
     * otherwise put the callback on a waiting list to be run later when we get the data
     * @param callback
     */
    getConsent(callback){
        if(this.cmpSuccess !== undefined){
            callback(this.cmpData, this.cmpSuccess);
        }
        else{
            this.consentCallbackList.push((cmpData, success)=>{ callback(this.cmpData, success); });
        }
    }
}