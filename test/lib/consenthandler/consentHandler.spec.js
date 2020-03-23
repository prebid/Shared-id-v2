import {expect} from 'chai';
import ConsentHandler from "../../../src/lib/consenthandler/consentHandler";
import { CMP_API, CMP_FRAME, CMP_GET_CONSENT_CMD, CMP_GET_MSG, CMP_GET_VENDOR_CMD, CMP_RETURN_MSG } from "../../../src/lib/consenthandler/drivers/cmp";
import {TCF_API, TCF_FRAME, TCF_GET_DATA, TCF_GET_MSG, TCF_RETURN_MSG} from "../../../src/lib/consenthandler/drivers/tcf";

function frameListener(event, consentData, callMsg, returnMsg, cmd) {
    const json = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    let resp;

    if (json[callMsg]) {
        const request = json[callMsg];
        if (request.command === cmd) {
            resp = consentData;
        }

        if (resp) {
            const msg = {
                [returnMsg]: {
                    callId: request.callId,
                    returnValue: resp,
                    success: true
                }
            };
            window.postMessage(msg, event.origin);
        }
    }
}

describe('Consent Handler', ()=>{
    beforeEach(()=>{
        delete window[CMP_API];
        delete window[TCF_API];
    });
    describe('No Handler', ()=>{
        it('test empty api', ()=>{
            const consentHandler = new ConsentHandler();
            expect(consentHandler.proxy).to.not.exist;
        });
    });

    describe('Cmp', ()=>{
        const sampleConsentData = {
            gdprApplies: true,
            hasGlobalScope: false,
            consentData: '12345_67890'
        };

        const sampleVendorConsents = {
            metadata: '09876_54321'
        };

        function mockCmpApi(cmd, arg, callback) {
            if (cmd === CMP_GET_CONSENT_CMD) {
                callback(sampleConsentData);
            }
            if (cmd === CMP_GET_VENDOR_CMD) {
                callback(sampleVendorConsents);
            }
        }

        describe('Local Proxy', ()=>{
            it('checkConsent', ()=> {
                window[CMP_API] = mockCmpApi;
                const consentHandler = new ConsentHandler();
                function callback(result, success){
                    expect(success).to.be.true;
                    expect(result.gdpr).to.be.true;
                    expect(result.gdpr_consent).equals(sampleConsentData.consentData);
                }
                consentHandler.checkConsent(callback);
            });
            it('failed cmp callback', ()=>{
                window[CMP_API] = function (cmd, args, callback) { callback(null, false); };
                const consentHandler = new ConsentHandler();
                function callback(result, success){
                    expect(success).to.be.false;
                }
                consentHandler.checkConsent(callback);
            });
            it('failed cmp delayed callback', (done)=>{
                window[CMP_API] = function (cmd, args, callback) { callback(null, false); };
                const consentHandler = new ConsentHandler();
                function callback(result, success){
                    expect(success).to.be.false;
                    done();
                }
                setTimeout(()=>consentHandler.checkConsent(callback),1000);
            });
        });

        describe('Frame Proxy', () => {
            const eventListener = function (event) {
                frameListener(event, sampleConsentData, CMP_GET_MSG, CMP_RETURN_MSG, CMP_GET_CONSENT_CMD);
            };

            before(() => {
                const iframe = document.createElement('iframe');
                iframe.name = CMP_FRAME;
                document.body.appendChild(iframe);
                window.addEventListener('message', eventListener);
            });

            after(() => {
                const doc = window.document;
                const list = doc.getElementsByName(CMP_FRAME);
                const node = list[0];
                node.parentNode.removeChild(node);
                window.removeEventListener('message', eventListener);
            });

            it('checkConsent', ()=> {
                const consentHandler = new ConsentHandler();
                function callback(result, success){
                    expect(success).to.be.true;
                    expect(result.gdpr).to.be.true;
                    expect(result.gdpr_consent).equals(sampleConsentData.consentData);
                }
                consentHandler.checkConsent(callback);
            });
            it('failed cmp callback', ()=>{
                window.removeEventListener('message', eventListener);
                const listener = function (event){
                    const msg = {[TCF_RETURN_MSG]: {callId: event.data[CMP_GET_MSG].callId, success: false}};
                    window.postMessage(msg, event.origin);
                };
                window.addEventListener('message', listener);

                const consentHandler = new ConsentHandler();
                function callback(result, success){
                    expect(success).to.be.false;
                }
                consentHandler.checkConsent(callback);
                window.removeEventListener('message', listener);
            });

        });
    });

    describe('Tcf', ()=>{
        const sampleTCData = {
            cmpStatus: 'loaded',
            eventStatus: 'tcloaded',
            gdprApplies: true,
            tcString: '12345_67890'
        };

        function mockTcfApi(cmd, version, callback) {
            callback(sampleTCData);
        }
        describe('Local Proxy', () => {
            it('checkConsent', ()=> {
                window[TCF_API] = mockTcfApi;
                const consentHandler = new ConsentHandler();
                function callback(result, success){
                    expect(success).to.be.true;
                    expect(result.gdpr).to.be.true;
                    expect(result.gdpr_consent).equals(sampleTCData.tcString);
                }
                consentHandler.checkConsent(callback);
            });
            it('failed cmp callback', ()=>{
                window[TCF_API] = function (cmd, version, callback) { callback(null, false); };
                const consentHandler = new ConsentHandler();
                function callback(result, success){
                    expect(success).to.be.false;
                }
                consentHandler.checkConsent(callback);
            })
        });

        describe('Frame Proxy', () => {
            const eventListener = function (event) {
                frameListener(event, sampleTCData, TCF_GET_MSG, TCF_RETURN_MSG, TCF_GET_DATA);
            };

            before(() => {
                const iframe = document.createElement('iframe');
                iframe.name = TCF_FRAME;
                document.body.appendChild(iframe);
                window.addEventListener('message', eventListener);
            });

            after(() => {
                const doc = window.document;
                const list = doc.getElementsByName(TCF_FRAME);
                const node = list[0];
                node.parentNode.removeChild(node);
                window.removeEventListener('message', eventListener);
            });

            it('checkConsent', ()=> {
                const consentHandler = new ConsentHandler();
                function callback(result, success){
                    expect(success).to.be.true;
                    expect(result.gdpr).to.be.true;
                    expect(result.gdpr_consent).equals(sampleTCData.tcString);
                }
                consentHandler.checkConsent(callback);
            });
            it('failed cmp callback', ()=>{
                window.removeEventListener('message', eventListener);
                const listener = function (event){
                    const msg = {[TCF_RETURN_MSG]: {callId: event.data[TCF_GET_MSG].callId, success: false}};
                    window.postMessage(msg, event.origin);
                };
                window.addEventListener('message', listener);

                const consentHandler = new ConsentHandler();
                function callback(result, success){
                    expect(success).to.be.false;
                }
                consentHandler.checkConsent(callback);
                window.removeEventListener('message', listener);
            });
        });
    });
});




