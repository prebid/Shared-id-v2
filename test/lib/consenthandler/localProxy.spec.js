import {expect} from 'chai';
import {Tcf, TCF_GET_DATA} from "../../../src/lib/consenthandler/drivers/tcf";
import {LocalProxy} from "../../../src/lib/consenthandler/proxy/localProxy";

describe("Local Proxy test", ()=> {
    describe("Tcf", () => {
        let driver;

        const sampleTCData = {
            cmpStatus: 'loaded',
            eventStatus: 'tcloaded',
            listenerId: 7,
            gdprApplies: true,
            tcString: '12345_67890'

        };

        beforeEach(() => {
            driver = new Tcf();
        });

        it("create Proxy", () => {
            const fCmp = function (cmd, version, callback) {
                callback(sampleTCData, true);
            };
            const proxy = new LocalProxy(fCmp, driver);

            proxy.fetchConsentData();
            expect(proxy.fCmp).to.exist;

            return new Promise((resolve) =>{
                proxy.getConsent((result) => { resolve(result); });
            }).then((result) => {
                expect(result.gdprApplies).to.equal(sampleTCData.gdprApplies);
                expect(result.consentString).to.equal(sampleTCData.tcString);
            });
        });

        it("callApi", () => {
            const fCmp = function (cmd, version, callback) {
                callback(sampleTCData, true);
            };
            const proxy = new LocalProxy(fCmp, driver);

            return new Promise((resolve) => {
               proxy.callApi(TCF_GET_DATA, "args", (result, success) => {
                   resolve([result, success]);
               })
            }).then((args) => {
                expect(args[1]).to.be.true;
                expect(args[0]).to.deep.equal(sampleTCData);
            });
        });

        it("callback failed", ()=>{
            const fCmp = function (cmd, version, callback) {
                callback(null, false);
            };
            const proxy = new LocalProxy(fCmp, driver);

            proxy.fetchConsentData();

            return new Promise((resolve) => {
                proxy.getConsent((result, success) => {
                    resolve(success);
                });
            }).then((success) => {
                expect(success).to.be.false;
            })
        });
    });
});
