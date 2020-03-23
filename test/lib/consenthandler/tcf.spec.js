import {Tcf, TCF_API, TCF_API_VERSION, TCF_FRAME, TCF_GET_DATA, TCF_GET_MSG, TCF_RETURN_MSG} from "../../../src/lib/consenthandler/drivers/tcf";
import {expect} from 'chai';

describe ('Tcf Driver', ()=>{
    let tcf;
    beforeEach(()=>{
        tcf = new Tcf();
    });
    it('test init', ()=>{
        expect(tcf.cmpApi).deep.equals(TCF_API);
        expect(tcf.returnMsgName).deep.equals(TCF_RETURN_MSG);
        expect(tcf.getMsgName).deep.equals(TCF_GET_MSG);
        expect(tcf.locatorFrame).deep.equals(TCF_FRAME);
    });

    it('test getConsentCmd', ()=>{
        const requests = tcf.getConsentCmd();
        expect(requests.length).equals(1);
        requests.forEach((req)=>{
            expect(req[0]).equals(TCF_GET_DATA);
        })
    });
    it('test getConsentData', ()=>{
        const testData = {gdprApplies: "gdprAppliesData", tcString: "stringData",publisher: {consents: {1: true}}};
        const result = tcf.getConsentData(testData);
        expect(result.gdpr).equals("gdprAppliesData");
        expect(result.gdpr_consent).equals("stringData");
        expect(result.hasSiteConsent).to.be.true;
    });
    it('test getConsentData without data', ()=>{
        const testData = {};
        const result = tcf.getConsentData(testData);
        expect(result.gdpr).to.not.exist;
        expect(result.gdpr_consent).to.not.exist;
        expect(result.hasSiteConsent).to.not.exist;
    });
    it('test createMsg', ()=>{
        const result = tcf.createMsg("cmd", "arg", "myid");
        expect(result[TCF_GET_MSG]).to.exist;
        expect(result[TCF_GET_MSG].command).equals("cmd");
        expect(result[TCF_GET_MSG].version).equals(TCF_API_VERSION);
        expect(result[TCF_GET_MSG].parameter).equals("arg");
        expect(result[TCF_GET_MSG].callId).equals("myid");
    });
    it('test callCmp', ()=>{
        const myProxy = function(command, version, callback, args){
            expect(command).equals("cmd");
            expect(version).equals(TCF_API_VERSION);
            expect(callback).equals("callback");
            expect(args).equals("args");
        };
        tcf.callCmp(myProxy, "cmd", "callback", "args");
    });
    it('test getConsent without data', ()=>{
        // eslint-disable-next-line no-console
        const callback = function(){console.log("should not be called")};
        tcf.getConsent(callback);
        expect(tcf.consentCallbackList.length).equals(1);
        delete tcf.consentCallbackList;
    });
    it('test getConsent with data', ()=>{
        const callback = function(result, success){
            expect(result.gdpr).equals('applies');
            expect(result.gdpr_consent).equals('somestring');
            expect(success).to.be.true;
        };
        tcf.tcData = {gdprApplies: 'applies', tcString: 'somestring'};
        tcf.getConsent(callback);
        delete tcf.tcData;
    });
});