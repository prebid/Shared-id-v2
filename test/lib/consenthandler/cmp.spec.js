import {expect} from 'chai';
import {
    Cmp,
    CMP_API,
    CMP_FRAME,
    CMP_GET_MSG,
    CMP_RETURN_MSG
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
    it('test formatData', ()=>{
        const testData = [{gdprApplies: true, consentData: "stringData"},{purposeConsents: {1: true}}];
        const result = cmp.formatData(testData);
        expect(result.version).to.equal(1);
        expect(result.gdprApplies).to.equal(true);
        expect(result.consentString).to.equal("stringData");
        expect(result).to.have.deep.property('vendorData', testData[1]);
    });
    it('test formatData without data', ()=>{
        const testData = [];
        const result = cmp.formatData(testData);
        expect(result.version).to.equal(1);
        expect(result.gdprApplies).to.be.undefined;
        expect(result.consentString).to.be.undefined;
        expect(result.vendorData).to.be.undefined;
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
        expect(cmp.consentCallbackList).to.have.lengthOf(0);
        cmp.getConsent(callback);
        expect(cmp.consentCallbackList).to.have.lengthOf(1);
    });
    it('test getConsent with data', ()=>{
        const cmpData = [{gdprApplies: true, consentData: 'somestring'}, {purposeConsents: {2: true}}];
        const callback = function(result, success){
            expect(result.gdprApplies).equals(true);
            expect(result.consentString).equals('somestring');
            expect(result).to.have.deep.property('vendorData', cmpData[1]);
            expect(success).to.be.true;
        };
        cmp.fetchDataCallback(cmpData, true);
        cmp.getConsent(callback);
    });
    it('test getConsent delayed loading', ()=>{
        const cmpData = [{gdprApplies: false, consentData: 'somestring'}, {purposeConsents: {3: false}}];
        const callback = function(result, success){
            expect(result.gdprApplies).to.be.false;
            expect(result.consentString).to.equal('somestring');
            expect(result).to.have.deep.property('vendorData', cmpData[1]);
            expect(success).to.be.true;
        };
        expect(cmp.consentCallbackList).to.have.lengthOf(0);
        cmp.getConsent(callback);
        expect(cmp.consentCallbackList).to.have.lengthOf(1);
        cmp.fetchDataCallback(cmpData, true);
    });
});
