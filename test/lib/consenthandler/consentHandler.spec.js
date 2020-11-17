import {expect} from 'chai';
import ConsentHandler from "../../../src/lib/consenthandler/consentHandler";
import {TCF_API, TCF_FRAME, TCF_GET_MSG, TCF_RETURN_MSG} from "../../../src/lib/consenthandler/drivers/tcf";

function frameListener(event, callMsg, returnMsg, sampleData, success) {
    let json;
    let msg;

    try {
        json = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    }
    catch(e) {
        return;
    }

    if (json[callMsg]) {
        const request = json[callMsg];
        const resp = sampleData[request.command];

        if (resp) {
            msg = {
                [returnMsg]: {
                    callId: request.callId,
                    returnValue: resp,
                    success: success
                }
            };
        }
        else {
            msg = {
                [returnMsg]: {
                    callId: request.callId,
                    returnValue: null,
                    success: false
                }
            }
        }

        window.postMessage(msg, event.origin);
    }
}

describe('Consent Handler', ()=>{

    describe('No Handler', ()=>{
        it('test empty api', ()=>{
            const consentHandler = new ConsentHandler();
            expect(consentHandler.proxy).to.not.exist;
        });

        // v1 was deprecated, just make sure nothing breaks
        it('test deprecated CMP api', ()=>{
            var CMP_API = "__cmp";
            window[CMP_API] = function (){};
            const consentHandler = new ConsentHandler();
            expect(consentHandler.proxy).to.not.exist;
            delete window[CMP_API];
        });
    });

    describe('Tcf', ()=>{
        const sampleTCData = {
            cmpStatus: 'loaded',
            eventStatus: 'tcloaded',
            gdprApplies: true,
            tcString: '12345_67890'
        };

        const sampleData = {
            addEventListener: sampleTCData
        };

        describe('Local Proxy', () => {
            afterEach(() => {
                delete window[TCF_API];
            });

            it('checkConsent', ()=> {
                window[TCF_API] = function(cmd, version, callback) {
                    callback(sampleTCData, true);
                };

                const consentHandler = new ConsentHandler();

                return new Promise((resolve) => {
                    consentHandler.checkConsent((result, success) => {
                        resolve([result, success]);
                    });
                }).then((args) => {
                    expect(args[1]).to.be.true;
                    expect(args[0].gdprApplies).to.be.true;
                    expect(args[0].consentString).to.equal(sampleTCData.tcString);
                    expect(args[0].hasStorageAccess).to.be.undefined;
                });
            });

            it('verify version', ()=> {
                return new Promise((resolve) => {
                    window[TCF_API] = function(cmd, version) {
                        resolve(version);
                    };

                    new ConsentHandler();
                }).then((version) => {
                    expect(version).to.equal(2);
                });
            });

            it('has storage access', ()=> {
                window[TCF_API] = function(cmd, version, callback) {
                    const data = Object.assign({}, sampleTCData);
                    data.purpose = {consents: {1: true}};
                    callback(data, true);
                };
                const consentHandler = new ConsentHandler();

                return new Promise((resolve) => {
                    consentHandler.hasStorageConsent((result) => {
                        resolve(result);
                    });
                }).then((result) => {
                    expect(result).to.be.true;
                });
            });

            it('has no storage access', ()=> {
                window[TCF_API] = function(cmd, version, callback) {
                    const data = Object.assign({}, sampleTCData);
                    data.purpose = {consents: {1: false}};
                    callback(data, true);
                };
                const consentHandler = new ConsentHandler();

                return new Promise((resolve) => {
                    consentHandler.hasStorageConsent((result) => {
                        resolve(result);
                    });
                }).then((result) => {
                    expect(result).to.be.false;
                });
            });

            it('gdprApplies false', ()=> {
                window[TCF_API] = function(cmd, version, callback) {
                    const data = Object.assign({}, sampleTCData);
                    data.gdprApplies = false;
                    data.purpose = {consents: {1: false}};
                    callback(data, true);
                };
                const consentHandler = new ConsentHandler();

                return new Promise((resolve) => {
                    consentHandler.hasStorageConsent((result) => {
                        resolve(result);
                    });
                }).then((result) => {
                    expect(result).to.be.true;
                });
            });

            it('failed tcf callback', ()=>{
                window[TCF_API] = function (cmd, version, callback) { callback(null, false); };
                const consentHandler = new ConsentHandler();

                return new Promise((resolve) => {
                    consentHandler.checkConsent((result, success) => {
                        resolve([result, success]);
                    });
                }).then((args) => {
                    expect(args[0]).to.not.have.property('gdprApplies');
                    expect(args[0]).to.not.have.property('consentString');
                    expect(args[0]).to.not.have.property('hasStorageAccess');
                    expect(args[1]).to.be.false;
                });
            });

            it('failed tcf delayed callback', ()=>{
                window[TCF_API] = function (cmd, args, callback) { callback(null, false); };
                const consentHandler = new ConsentHandler();

                return new Promise((resolve) => {
                    setTimeout( () => {
                        consentHandler.checkConsent((result, success) => {
                            resolve(success);
                        });
                    }, 500);
                }).then((success) => {
                    expect(success).to.be.false;
                });
            });
        });

        describe('Frame Proxy', () => {
            let eventListener;

            beforeEach(() => {
                const iframe = document.createElement('iframe');
                iframe.name = TCF_FRAME;
                document.body.appendChild(iframe);
            });

            afterEach(() => {
                const doc = window.document;
                const list = doc.getElementsByName(TCF_FRAME);
                const node = list[0];
                node.parentNode.removeChild(node);
                if (eventListener) {
                    window.removeEventListener('message', eventListener);
                    eventListener = null;
                }
            });

            it('checkConsent', ()=> {
                eventListener = function (event) {
                    frameListener(event, TCF_GET_MSG, TCF_RETURN_MSG, sampleData, true);
                };
                window.addEventListener('message', eventListener);

                const consentHandler = new ConsentHandler();

                return new Promise((resolve) => {
                    consentHandler.checkConsent((result, success) => {
                        resolve([result, success]);
                    });
                }).then((args) => {
                    expect(args[1]).to.be.true;
                    expect(args[0].gdprApplies).to.be.true;
                    expect(args[0].consentString).to.equal(sampleTCData.tcString);
                });
            });

            it('failed tcf callback', ()=>{
                eventListener = function (event){
                    frameListener(event, TCF_GET_MSG, TCF_RETURN_MSG, sampleData, false);
                };
                window.addEventListener('message', eventListener);

                const consentHandler = new ConsentHandler();

                return new Promise((resolve) => {
                    consentHandler.checkConsent((result, success) => {
                        resolve(success);
                    });
                }).then((success) => {
                    expect(success).to.be.false;
                });
            });
        });
    });
});




