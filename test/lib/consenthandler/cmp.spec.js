import {expect} from 'chai';
import {
    Cmp,
    CMP_API,
    CMP_FRAME,
    CMP_GET_CONSENT_CMD,
    CMP_GET_MSG,
    CMP_RETURN_MSG,
    CMP_SITE_CONSENT_CMD
} from "../../../src/lib/consenthandler/drivers/cmp";

describe ('Cmp Driver', ()=>{
    let cmp;
    beforeEach(()=>{
        cmp = new Cmp();
    });
    it('test init', ()=>{
        expect(cmp.cmpApi).deep.equals(CMP_API);
        expect(cmp.returnMsgName).deep.equals(CMP_RETURN_MSG);
        expect(cmp.getMsgName).deep.equals(CMP_GET_MSG);
        expect(cmp.locatorFrame).deep.equals(CMP_FRAME);
    });

    it('test getConsentCmd', ()=>{
        const requests = cmp.getConsentCmd();
        expect(requests.length).equals(2);
        expect(requests[0][0]).equals(CMP_GET_CONSENT_CMD);
        expect(requests[1][0]).equals(CMP_SITE_CONSENT_CMD);
    });
    it('test getConsentData', ()=>{
        const testData = [{gdprApplies: "gdprAppliesData", consentData: "stringData"},true];
        const result = cmp.getConsentData(testData);
        expect(result.gdpr).equals("gdprAppliesData");
        expect(result.gdpr_consent).equals("stringData");
        expect(result.hasSiteConsent).to.be.true;
    });
    it('test getConsentData without data', ()=>{
        const testData = [];
        const result = cmp.getConsentData(testData);
        expect(result.gdpr).to.not.exist;
        expect(result.gdpr_consent).to.not.exist;
        expect(result.hasSiteConsent).to.not.exist;
    });
    it('test createMsg', ()=>{
        const result = cmp.createMsg("cmd", "arg", "myid");
        expect(result[CMP_GET_MSG]).to.exist;
        expect(result[CMP_GET_MSG].command).equals("cmd");
        expect(result[CMP_GET_MSG].parameter).equals("arg");
        expect(result[CMP_GET_MSG].callId).equals("myid");
    });
    it('test callCmp', ()=>{
        const myProxy = function(command, callback, args){
            expect(command).equals("cmd");
            expect(callback).equals("callback");
            expect(args).equals("args");
        };
        cmp.callCmp(myProxy, "cmd", "args", "callback");
    });
    it('test getConsent without data', ()=>{
        // eslint-disable-next-line no-console
        const callback = function(){console.log("should not be called")};
        expect(cmp.consentCallbackList).length === 0;
        cmp.getConsent(callback);
        expect(cmp.consentCallbackList).length === 1;
    });
    it('test getConsent with data', ()=>{
        const callback = function(result, success){
            expect(result.gdpr).equals('applies');
            expect(result.gdpr_consent).equals('somestring');
            expect(success).to.be.true;
        };
        const cmpData = [{gdprApplies: 'applies', consentData: 'somestring'}];
        cmp.fetchDataCallback(cmpData, true);
        cmp.getConsent(callback);
    });
    it('test getConsent delayed loading', ()=>{
        const callback = function(result, success){
            expect(result.gdpr).equals('applies');
            expect(result.gdpr_consent).equals('somestring');
            expect(success).to.be.true;
        };
        const cmpData = [{gdprApplies: 'applies', consentData: 'somestring'}];
        expect(cmp.consentCallbackList).length === 0;
        cmp.getConsent(callback);
        expect(cmp.consentCallbackList).length === 1;
        cmp.fetchDataCallback(cmpData, true);
    });
});
