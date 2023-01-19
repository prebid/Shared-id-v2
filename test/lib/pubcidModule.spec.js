import {expect} from 'chai';
import {setupPubcid} from '../../src/lib/pubcidModule';
import {clearAllCookies} from '../../src/lib/cookieUtils';
import log from 'loglevel';
import sinon from "sinon";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89a-f][0-9a-f]{3}-[0-9a-f]{12}$/;
const CMP_CALL    = "__tcfapi";

describe('Standalone pubcid default', ()=>{
    function mockResult(hasConsent){
        return {cmpStatus: 'loaded', eventStatus: 'tcloaded', gdprApplies: true, purpose: {consents: {1: hasConsent}}};
    }

    after(()=>{
        delete window.PublisherCommonId;
        delete window[CMP_CALL];
        clearAllCookies();
        window.localStorage.clear();
    });

    beforeEach(()=>{
        delete window.PublisherCommonId;
        delete window[CMP_CALL];
        clearAllCookies();
        window.localStorage.clear();
    });

   it('check global object', ()=>{
        setupPubcid(window, document, {});
        expect(window.PublisherCommonId).to.exist;
        expect(typeof window.PublisherCommonId).to.equal('object');
   });

   it('auto init and get pubcid', ()=>{
        setupPubcid(window, document, {});
        const pubcid = window.PublisherCommonId.getId();
        expect(pubcid).to.match(uuidPattern);

        const pubcid2 = window.PublisherCommonId.getId();
        expect(pubcid2).to.equal(pubcid);
   });

   it('no auto init with empty pubcid', ()=>{
        setupPubcid(window, document, {autoinit: false});
        const pubcid = window.PublisherCommonId.getId();
        expect(pubcid).to.equal('');
   });

    it('generate id', ()=> {
        setupPubcid(window, document, {});
        const pubcid = window.PublisherCommonId.generateId();
        expect(pubcid).to.match(uuidPattern);
    });

    it('iab consent', () => {
        window[CMP_CALL] = (cmd, args, callback) => {
            callback(mockResult(true), true);
        };
        setupPubcid(window, document, {consent: {type: 'iab'}});

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(window.PublisherCommonId.getId());
            }, 200);
        }).then((pubcid) => {
            expect(pubcid).to.match(uuidPattern);
        });
    });

    it('iab no consent', () => {
        window[CMP_CALL] = (cmd, args, callback) => {
            callback(mockResult(false), true);
        };
        setupPubcid(window, document, {consent: {type: 'iab'}});

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(window.PublisherCommonId.getId());
            }, 200);
        }).then((pubcid) => {
            expect(pubcid).to.equal('');
        });
    });

    it('createId', ()=>{
        setupPubcid(window, document, {autoinit: false});
        let pubcid = PublisherCommonId.getId();
        expect(pubcid).to.equal('');
        window.PublisherCommonId.createId();
        pubcid = PublisherCommonId.getId();
        expect(pubcid).to.match(uuidPattern);
    });

    it('updateIdWithConsent', (done)=>{
        setupPubcid(window, document, {autoinit: false});
        let pubcid = PublisherCommonId.getId();
        expect(pubcid).to.equal('');
        window.PublisherCommonId.updateIdWithConsent(
            function(id) {
                expect(id).to.match(uuidPattern);
                done();
            }
        );
    });

    describe('process queue', function() {
        let stubWarn;
        let stubDebug;

        beforeEach(function() {
            stubWarn = sinon.stub(log, 'warn');
            stubDebug = sinon.stub(log, 'debug');
        });

        afterEach(function() {
            stubWarn.restore();
            stubDebug.restore();
        });

        it('pushed getIdWithConsent before setup', (done)=>{
            window.PublisherCommonId = {que: []};
            window.PublisherCommonId.que.push(['getIdWithConsent', function(pubcid) {
                sinon.assert.calledWith(stubDebug, 'Processing command: getIdWithConsent');
                expect(pubcid).to.match(uuidPattern);
                done();
            }]);
            setupPubcid(window, document, {});
        });

        it('pushed getIdWithConsent after setup', (done)=>{
            window.PublisherCommonId = {que: []};
            setupPubcid(window, document, {});
            window.PublisherCommonId.que.push(['getIdWithConsent', function(pubcid) {
                sinon.assert.calledWith(stubDebug, 'Processing command: getIdWithConsent');
                expect(pubcid).to.match(uuidPattern);
                done();
            }]);
        });

        it('pushed unrecognized command after setup', ()=>{
            window.PublisherCommonId = {que: []};
            setupPubcid(window, document, {});
            window.PublisherCommonId.que.push(['bogus']);
            sinon.assert.calledWith(stubWarn, 'Skipped unrecognized command: bogus');
        });

        it('pushed function before setup', (done)=>{
            window.PublisherCommonId = {que: []};
            window.PublisherCommonId.que.push(function() {
                window.PublisherCommonId.getIdWithConsent(function(pubcid) {
                    sinon.assert.calledWith(stubDebug, 'Processing anonymous function');
                    expect(pubcid).to.match(uuidPattern);
                    done();
                });
            });
            setupPubcid(window, document, {});
        });

        it('pushed function after setup', (done)=>{
            window.PublisherCommonId = {que: []};
            setupPubcid(window, document, {});
            window.PublisherCommonId.que.push(function() {
                window.PublisherCommonId.getIdWithConsent(function(pubcid) {
                    sinon.assert.calledWith(stubDebug, 'Processing anonymous function');
                    expect(pubcid).to.match(uuidPattern);
                    done();
                });
            });
        });

        it('pushed function before setup no consent', (done)=>{
            window[CMP_CALL] = (cmd, args, callback) => {
                callback(mockResult(false), true);
            };
            window.PublisherCommonId = {que: []};
            window.PublisherCommonId.que.push(function() {
                window.PublisherCommonId.getIdWithConsent(function(pubcid) {
                    sinon.assert.calledWith(stubDebug, 'Processing anonymous function');
                    expect(pubcid).to.be.null;
                    done();
                });
            });
            setupPubcid(window, document, {});
        });
    });
});
