export const GET_CONSENT_DATA = "getConsentData";
export const GET_SITE_CONSENT = "siteHasConsent";
export const CMP_GET_MSG = '__cmpCall';
export const CMP_RETURN_MSG = '__cmpReturn';
export const CMP_FRAME = '__cmpLocator';
export const CMP_API = '__cmp';


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
export default class Cmp {
    constructor() {
        this.returnMsgName = CMP_RETURN_MSG;
        this.locatorFrame = CMP_FRAME;
        this.cmpApi = CMP_API;
        this.safeframeCall = "cmp";
    }

    getConsentCmd() {
        return [[GET_CONSENT_DATA],[GET_SITE_CONSENT]];
    }

    getSafeFrameData(data) {
        //TODO: once the msg definition is clearer for safeframe  this needs to handle multiple commands
        return (data.cmpCommand === GET_CONSENT_DATA) ?
            data.vendorConsentData : data.vendorConsents;
    }

    getConsentData(result) {
        return {
            gdpr: result[0].gdprApplies,
            gdpr_consent: result[0].consentData,
            hasSiteConsent: result[1]
        };
    }

    createMsg(cmd, arg, callId) {
        let msg = {
            [CMP_GET_MSG]: {
                command: cmd,
                parameter: arg,
                callId: callId
            }
        };
        return (msg);
    }
}
