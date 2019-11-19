export const TCF_GET_DATA = "getTCData";
export const TCF_RETURN_MSG = "__tcfapiReturn";
export const TCF_GET_MSG = "__tcfapiCall";
export const TCF_FRAME = "__tcfapiLocator";
export const TCF_API = '__tcfapi';

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
export default class Tcf {
    constructor() {
        this.returnMsgName = TCF_RETURN_MSG;
        this.locatorFrame = TCF_FRAME;
        this.cmpApi = TCF_API;
    }

    getConsentCmd(){
        return [[TCF_GET_DATA]];
    }

    getConsentData(result){
        if(!result[0].publisher){ result[0].publisher = {}; }
        if(!result[0].publisher.consents){ result[0].publisher.consents = {}; }
        return {
            gdpr: result[0].gdprApplies,
            gdpr_consent: result[0].tcString,
            hasSiteConsent: result[0].publisher.consents['1']
        };
    }

    createMsg(cmd,arg,callId){
        let msg = {
            [TCF_GET_MSG]: {
                command: cmd,
                parameter: arg,
                callId: callId
            }
        };
        return(msg);
    }
}