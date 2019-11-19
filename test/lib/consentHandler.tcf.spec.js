import {expect} from 'chai';
import ConsentHandler from "../../src/lib/consentHandler/consentHandler";

const CMP_CALL     = "__tcfapi";
const CMP_GET_CMD  = "getTCData";

const sampleTCData = {
    'gdprApplies': true,
    'tcString': '12345_67890'
};
describe('Tcf', () => {
    describe('iab', () => {
        const empty = {gdpr: null, gdpr_consent: null, hasSiteConsent: true};
        afterEach(() => {
            if (window[CMP_CALL])
                delete window[CMP_CALL];
        });

        it('call cmp', (done) => {
            const consentConfig = {
                type: 'iab',
                timeout: 100
            };

            window[CMP_CALL] = (cmd, arg, callback) => {
                if (cmd === CMP_GET_CMD) {
                    callback(sampleTCData);
                }
            };

            const consentUtils = new ConsentHandler(consentConfig);
            consentUtils.checkConsent((resp,success) => {
                expect(resp).to.exist;
                expect(success).to.be.true;
                expect(resp.gdpr).to.be.true;
                expect(resp.gdpr_consent).equals('12345_67890');
                done();
            });
        });

        it('handles missing cmp', (done) => {
            const consentConfig = {
                type: 'iab',
                timeout: 100,
                alwaysPing: true
            };

            const consentUtils = new ConsentHandler(consentConfig);
            consentUtils.checkConsent((resp, success) => {
                expect(resp).to.exist;
                expect(success).to.be.true;
                expect(resp).deep.equal(empty);
                done();
            });
        });

        it('handles missing cmp no ping', (done) => {
            const consentConfig = {
                type: 'iab',
                timeout: 100,
                alwaysPing: false
            };

            const consentUtils = new ConsentHandler(consentConfig);
            consentUtils.checkConsent((resp, success) =>{
                expect(resp).to.exist;
                expect(success).to.be.true;
                expect(resp).deep.equal(empty);
                done();
            });
        });

        describe('iframe', () => {
            const consentConfig = { type: 'iab', timeout: 100 };
            const eventListener = function (event) {
                const json = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                let resp;

                if (json.__tcfapiCall) {
                    const request = json.__tcfapiCall;
                    if (request.command === 'getTCData') {
                        resp = sampleTCData;
                    }

                    if (resp) {
                        const msg = {
                            __tcfapiReturn: {
                                callId: request.callId,
                                returnValue: resp,
                                success: true
                            }
                        };
                        window.postMessage(msg, event.origin);
                    }
                }
            };

            before(()=>{
                const iframe = document.createElement('iframe');
                iframe.name = '__tcfapiLocator';
                document.body.appendChild(iframe);
                window.addEventListener('message', eventListener);
            });

            after(()=>{
                const doc = window.document;
                const list = doc.getElementsByName('__tcfapiLocator');
                const node = list[0];
                node.parentNode.removeChild(node);
                window.removeEventListener('message', eventListener);
            });

            it('call frame', (done) => {
                const consentUtils = new ConsentHandler(consentConfig);
                expect(consentUtils.driver.cmpApi).equals("__tcfapi");
                consentUtils.checkConsent((resp, success) => {
                    expect(resp).to.exist;
                    expect(success).to.be.true;
                    expect(resp.gdpr).to.be.true;
                    expect(resp.gdpr_consent).equals(sampleTCData.tcString);
                    done();
                });
            });
        })
    });

});
