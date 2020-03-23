export class BaseCmp {
    constructor(api, returnMsgName, getMsgName, locatorFrame) {
        this.cmpApi = api;
        this.returnMsgName = returnMsgName;
        this.getMsgName = getMsgName;
        this.locatorFrame = locatorFrame;
    }

    // Normalize the data returned to the caller since cmp and tcf use different data calls to fetch the needed fields
    formatConsentData(gdprApplies, consentString, hasConsent) {
        return {
            gdpr: gdprApplies,
            gdpr_consent: consentString,
            hasSiteConsent: hasConsent
        };
    }
}