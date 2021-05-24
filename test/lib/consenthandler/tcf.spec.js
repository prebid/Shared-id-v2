import {Tcf, TCF_API, TCF_API_VERSION, TCF_FRAME, TCF_GET_MSG, TCF_RETURN_MSG} from "../../../src/lib/consenthandler/drivers/tcf";
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
    it('test formatData', ()=>{
        const testData = {gdprApplies: true, tcString: "stringData",publisher: {consents: {1: true}}};
        const result = tcf.formatData(testData);
        expect(result.version).to.equal(2);
        expect(result.gdprApplies).to.equal(true);
        expect(result.consentString).to.equal("stringData");
        expect(result).to.have.deep.property('tcData', testData);
    });
    it('test getConsentData without data', ()=>{
        const testData = undefined;
        const result = tcf.formatData(testData);
        expect(result.version).to.equal(2);
        expect(result.gdprApplies).to.be.undefined;
        expect(result.consentString).to.be.undefined;
        expect(result.tcData).to.be.undefined;
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
    });
    it('test getConsent with data', ()=>{
        const testData = {cmpStatus: 'loaded', eventStatus: 'useractioncomplete', gdprApplies: true, tcString: 'somestring', publisher: {consents: {1: true}}};

        tcf.fetchDataCallback(testData, true);

        return new Promise((resolve) => {
            tcf.getConsent((result) => {
                resolve(result);
            });
        }).then((result) => {
            expect(result.version).to.equal(2);
            expect(result.gdprApplies).to.equal(true);
            expect(result.consentString).to.equal('somestring');
            expect(result).to.have.deep.property('tcData', testData);
        });
    });
    it('test getConsent delayed loading', ()=>{
        const testData = {cmpStatus: 'loaded', eventStatus: 'useractioncomplete', gdprApplies: true, tcString: 'somestring', publisher: {consents: {5: true}}};

        return new Promise((resolve) => {
            tcf.getConsent((result) => {
                resolve(result);
            });
            expect(tcf.consentCallbackList).to.have.lengthOf(1);
            tcf.fetchDataCallback(testData, true);
        }).then((result) => {
            expect(result.version).to.equal(2);
            expect(result.gdprApplies).to.equal(true);
            expect(result.consentString).to.equal('somestring');
            expect(result).to.have.deep.property('tcData', testData);
        });
    });

    it('clear queue on updates', ()=>{
        const testData = {cmpStatus: 'loaded', eventStatus: 'useractioncomplete', gdprApplies: true, tcString: 'somestring', publisher: {consents: {5: true}}};
        const expectedResult = {version: TCF_API_VERSION, gdprApplies: true, consentString: testData.tcString, hasStorageAccess: undefined, tcData: testData};
        expect(tcf.consentCallbackList).to.have.lengthOf(0);
        tcf.getConsent(()=>{});
        tcf.getConsent(()=>{});
        expect(tcf.consentCallbackList).to.have.lengthOf(2);
        tcf.fetchDataCallback(null, false);
        expect(tcf.consentCallbackList).to.have.lengthOf(0);
        tcf.getConsent((tcData, success) =>{
            expect(success).to.be.false;
            expect(tcData).deep.equal({version: TCF_API_VERSION});
        });
        tcf.fetchDataCallback(testData, true);
        tcf.getConsent((tcData, success) =>{
            expect(success).to.be.true;
            expect(tcData).deep.equal(expectedResult);
        });
        expect(tcf.consentCallbackList).to.have.lengthOf(0);
    });
});
