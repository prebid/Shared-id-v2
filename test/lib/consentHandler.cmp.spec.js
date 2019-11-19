import {expect} from 'chai';
import ConsentHandler from "../../src/lib/consentHandler/consentHandler";

const CMP_CALL = "__cmp";
const CMP_GET_CONSENT_CMD = "getConsentData";
const CMP_GET_SITE_CONSENT = "siteHasConsent";

const sampleConsentData = {
    gdprApplies: true,
    hasGlobalScope: false,
    consentData: '12345_67890'
};

describe('Cmp', () => {
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
                if (cmd === CMP_GET_CONSENT_CMD) {
                    callback(sampleConsentData);
                }
                if (cmd === CMP_GET_SITE_CONSENT){
                    callback(true);
                }
            };

            const consentHandler = new ConsentHandler(consentConfig);
            consentHandler.checkConsent((resp, success) => {
                expect(resp).to.exist;
                expect(success).to.be.true;
                expect(resp.gdpr).to.be.true;
                expect(resp.gdpr_consent).equals(sampleConsentData.consentData);
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
            consentUtils.checkConsent((resp, success) => {
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

                if (json.__cmpCall) {
                    const request = json.__cmpCall;
                    if (request.command === CMP_GET_CONSENT_CMD) {
                        resp = sampleConsentData;
                    }
                    else if (request.command === CMP_GET_SITE_CONSENT){
                        resp = true;
                    }

                    if (resp) {
                        const msg = {
                            __cmpReturn: {
                                callId: request.callId,
                                returnValue: resp,
                                success: true
                            }
                        };
                        window.postMessage(msg, event.origin);
                    }
                }
            };

            before(() => {
                const iframe = document.createElement('iframe');
                iframe.name = '__cmpLocator';
                document.body.appendChild(iframe);
                window.addEventListener('message', eventListener);
            });

            after(() => {
                const doc = window.document;
                const list = doc.getElementsByName('__cmpLocator');
                const node = list[0];
                node.parentNode.removeChild(node);
                window.removeEventListener('message', eventListener);
            });

            it('call frame', (done) => {
                const consentUtils = new ConsentHandler(consentConfig);
                expect(consentUtils.driver.cmpApi).equals("__cmp");
                consentUtils.checkConsent((resp, success) => {
                    expect(resp).to.exist;
                    expect(success).to.be.true;
                    expect(resp.gdpr).to.be.true;
                    expect(resp.gdpr_consent).equals(sampleConsentData.consentData);
                    done();
                });
            });
        })
    });

});
