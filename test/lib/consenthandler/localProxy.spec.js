import {expect} from 'chai';
import {Tcf, TCF_API, TCF_GET_DATA} from "../../../src/lib/consenthandler/drivers/tcf";
import {LocalProxy} from "../../../src/lib/consenthandler/proxy/localProxy";
import {Cmp, CMP_API, CMP_GET_CONSENT_CMD} from "../../../src/lib/consenthandler/drivers/cmp";

const sampleTCData = {
    cmpStatus: 'loaded',
    eventStatus: 'tcloaded',
    listenerId: 7,
    gdprApplies: true,
    tcString: '12345_67890'

};

describe("Local Proxy test", ()=> {
    describe("Tcf", () => {
        let driver, fCmp;
        before(() => {
            window[TCF_API] = function (cmd, version, callback) {
                callback(sampleTCData, true);
            };
            fCmp = window[TCF_API];
            driver = new Tcf();
        });
        after(()=>{
            delete window[TCF_API];
        });

        it("create Proxy", () => {
            const proxy = new LocalProxy(fCmp, driver);
            proxy.fetchConsentData();
            expect(proxy.fCmp).exist;
            proxy.getConsent((result) => {
                expect(result.gdpr).equal(sampleTCData.gdprApplies);
                expect(result.gdpr_consent).equal(sampleTCData.tcString);
            });
        });

        it("callApi", () => {
            const proxy = new LocalProxy(fCmp, driver);
            proxy.callApi(TCF_GET_DATA, "args", (result, success) => {
                expect(success).to.be.true;
                expect(result).deep.equal(sampleTCData); //unformatted data return from window[TCF_API]
            });
        });
        it("callback failed", ()=>{
            window[TCF_API] = function (cmd, version, callback) {
                callback(null, false);
            };
            fCmp = window[TCF_API];
            driver = new Tcf();
            const proxy = new LocalProxy(fCmp, driver);
            proxy.fetchConsentData();
            proxy.getConsent((result, success)=>{
                expect(success).to.be.false;
            })
        });
    });
    describe("Cmp", () => {
        let driver, fCmp;
        const sampleConsentData = {
            gdprApplies: true,
            consentData: '12345_67890'
        };
        before(() => {
            window[CMP_API] = function (cmd, args, callback) {
                expect(cmd).equals(CMP_GET_CONSENT_CMD);
                callback(sampleConsentData);
            };
            fCmp = window[CMP_API];
            driver = new Cmp();
        });

        after(()=>{
            delete window[CMP_API];
        });

        it("create Proxy", () => {
            const proxy = new LocalProxy(fCmp, driver);
            proxy.fetchConsentData();
            expect(proxy.fCmp).exist;
            proxy.getConsent((result) => {
                expect(result.gdpr).equal(sampleConsentData.gdprApplies);
                expect(result.gdpr_consent).equal(sampleConsentData.consentData);
            });
        });
        it("callback failed", ()=>{
            window[CMP_API] = function (cmd, args, callback) {
                callback(null, false);
            };
            fCmp = window[CMP_API];
            driver = new Cmp();
            const proxy = new LocalProxy(fCmp, driver);
            proxy.fetchConsentData();
            proxy.getConsent((result, success)=>{
                expect(success).to.be.false;
            })
        });
    });
});
