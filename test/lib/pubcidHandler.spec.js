import {expect} from 'chai';
import sinon from "sinon";
import PubcidHandler from '../../src/lib/pubcidHandler';
import * as cookieUtils from "../../src/lib/cookieUtils";
import * as utils from '../../src/lib/utils';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89a-f][0-9a-f]{3}-[0-9a-f]{12}$/;
const CMP_CALL    = "__tcfapi";

describe('PubcidHandler', ()=> {

    const DEFAULT_NAME = '_pubcid';
    const DEFAULT_OPTOUT_NAME = '_pubcid_optout';

    function mockResult(hasConsent){
        return {cmpStatus: 'loaded', eventStatus: 'tcloaded', gdprApplies: true, publisher: {consents: {1: hasConsent}}};
    }

    function clearAll() {
        cookieUtils.clearAllCookies();

        if (window.localStorage) {
            window.localStorage.clear();
        }
    }

    describe("storage operations", ()=> {
        before(()=>{
            clearAll();
        });

        afterEach(() => {
            if(window[CMP_CALL]) delete  window[CMP_CALL];
            clearAll();
        });

        describe("iab", ()=>{
            it('with consent', (done) => {
                window[CMP_CALL] = (cmd, args, callback) => {
                    callback(mockResult(true));
                };

                const handler = new PubcidHandler();
                let pubcid = handler.fetchPubcid();

                setTimeout(()=>{
                    if(!pubcid){
                        pubcid = handler.readPubcid();
                    }
                    expect(pubcid).to.match(uuidPattern);
                    done();
                }, 500);
            });

            it('without consent', () => {
                window[CMP_CALL] = (cmd, args, callback) => {
                    callback(mockResult(false));
                };

                const handler = new PubcidHandler();
                const pubcid = handler.fetchPubcid();
                expect(pubcid).to.be.null;
            });
        });

        describe("non iab", ()=>{
            const pubcidConfig = { consent:{ type: '' } };
            it('with consent', (done) => {
                window[CMP_CALL] = (cmd, args, callback) => {
                    callback(mockResult(true));
                };

                const handler = new PubcidHandler(pubcidConfig);
                let pubcid = handler.fetchPubcid();

                setTimeout(()=>{
                    if(!pubcid){
                        pubcid = handler.readPubcid();
                    }
                    expect(pubcid).to.match(uuidPattern);
                    done();
                }, 500);
            });

            it('without consent', () => {
                window[CMP_CALL] = (cmd, args, callback) => {
                    callback({gdprApplies: true, publisher: {consents: {1: false}}});
                    callback(mockResult(false));
                };

                const handler = new PubcidHandler();
                const pubcid = handler.fetchPubcid();
                expect(pubcid).to.be.null;
            });
        });


        it('default opt-in', () => {
            const handler = new PubcidHandler();
            const pubcid = handler.fetchPubcid();
            expect(pubcid).to.match(uuidPattern);

            const storedValue = window.localStorage.getItem(DEFAULT_NAME);
            expect(storedValue).to.equal(pubcid);

            const pubcid2 = handler.fetchPubcid();
            expect(pubcid2).to.equal(pubcid);
        });

        it('default opt-out', () => {
            cookieUtils.setCookie(DEFAULT_OPTOUT_NAME, 1, 50);

            const handler = new PubcidHandler();
            const pubcid = handler.fetchPubcid();

            expect(pubcid).to.be.null;

            const storedValue = window.localStorage.getItem(DEFAULT_NAME);
            expect(storedValue).to.be.null;
        });

        it('change cookie name', () => {
            const cookieName = 'abc';
            const options = {name: cookieName};

            const handler = new PubcidHandler(options);
            const pubcid = handler.fetchPubcid();
            expect(pubcid).to.match(uuidPattern);

            // local storage should have precedence.  so
            // cookie is not updated.
            const val = cookieUtils.getCookie(cookieName);
            expect(val).to.be.null;
        });

        xit('disabled', () => {
            const options = {enabled: false};

            const handler = new PubcidHandler(options);
            const pubcid = handler.fetchPubcid();
            expect(pubcid).toBeUndefined();

            const storedValue = window.localStorage.getItem(DEFAULT_NAME);
            expect(storedValue).to.be.null;
        });

        it('cookie read only', () => {
            const options = {type: 'cookie', create: false};

            const handler = new PubcidHandler(options);
            let pubcid = handler.fetchPubcid();

            expect(pubcid).to.be.null;

            cookieUtils.setCookie(DEFAULT_NAME, 'abc', 10);
            pubcid = handler.fetchPubcid();
            expect(pubcid).to.equal('abc');

            const storedValue = window.localStorage.getItem(DEFAULT_NAME);
            expect(storedValue).to.be.null;
        });

        it('accidental write of undefined', () => {
            const key = 'test';

            const handler = new PubcidHandler();
            handler.writeValue(key, undefined);
            const val = localStorage.getItem(key);

            expect(val).to.be.null;

        });

        it('bad id recovery', () => {
            cookieUtils.setCookie(DEFAULT_NAME, 'undefined', 10);

            const handler = new PubcidHandler();
            const pubcid = handler.fetchPubcid();

            expect(pubcid).to.match(uuidPattern);
        });

        it('cookie only', () => {
            const handler = new PubcidHandler({type: 'cookie'});
            const pubcid = handler.fetchPubcid();
            expect(pubcid).to.match(uuidPattern);

            const storedValue = window.localStorage.getItem(DEFAULT_NAME);
            expect(storedValue).to.be.null;

            const pubcid2 = handler.fetchPubcid();
            expect(pubcid2).to.equal(pubcid);
        });

        it('storage only', () => {
            const handler = new PubcidHandler({type: 'html5'});
            const pubcid = handler.fetchPubcid();
            expect(pubcid).to.match(uuidPattern);

            const cookieValue = cookieUtils.getCookie(DEFAULT_NAME);
            expect(cookieValue).to.be.null;

            const pubcid2 = handler.fetchPubcid();
            expect(pubcid2).to.equal(pubcid);
        });

        it('local storage first', () => {
            const handler = new PubcidHandler({type: ' html5,cookie'});
            const pubcid = handler.fetchPubcid();
            expect(pubcid).to.match(uuidPattern);

            const storedValue = window.localStorage.getItem(DEFAULT_NAME);
            expect(storedValue).to.equal(pubcid);

            const cookieValue = cookieUtils.getCookie(DEFAULT_NAME);
            expect(cookieValue).to.be.null;

            const pubcid2 = handler.fetchPubcid();
            expect(pubcid2).to.equal(pubcid);
        });

        it('cookie first', () => {
            const handler = new PubcidHandler({type: 'cookie ,html5'});
            const pubcid = handler.fetchPubcid();
            expect(pubcid).to.match(uuidPattern);

            const storedValue = window.localStorage.getItem(DEFAULT_NAME);
            expect(storedValue).to.be.null;

            const cookieValule = cookieUtils.getCookie(DEFAULT_NAME);
            expect(cookieValule).to.equal(pubcid);

            const pubcid2 = handler.fetchPubcid();
            expect(pubcid2).to.equal(pubcid);
        });

        it('copy cookie value to storage', () => {
            const expectedValue = 'this-is-cookie';
            const handler = new PubcidHandler();

            // set up cookie value
            cookieUtils.setCookie(DEFAULT_NAME, expectedValue, 60);
            const pubcid = handler.fetchPubcid();
            // pubcid should come from cookie
            expect(pubcid).to.equal(expectedValue);
            // check local storage
            const storedValue = window.localStorage.getItem(DEFAULT_NAME);
            expect(storedValue).to.equal(expectedValue);
        });

        it('avoid copying storage value to cookie', () => {
            const expectedValue = 'this-is-storage';
            const handler = new PubcidHandler();

            // set up storage value
            window.localStorage.setItem(DEFAULT_NAME, expectedValue);
            const pubcid = handler.fetchPubcid();
            // pubcid should come from storage
            expect(pubcid).to.equal(expectedValue);
            // check cookie
            const cookieValue = cookieUtils.getCookie(DEFAULT_NAME);
            expect(cookieValue).to.be.null;
        });

    });

    describe('pixels and extend', ()=>{
        let pixelSpy, cookieSpy;
        before(()=>{
            pixelSpy = sinon.spy(utils, 'firePixel');
            cookieSpy = sinon.spy(cookieUtils, 'setCookie');
            clearAll();
        });

        beforeEach(() => {
            pixelSpy.resetHistory();
            cookieSpy.resetHistory();
        });

        afterEach(() => {
            clearAll();
        });

        it('extend is enabled', () => {
            const options = {type: 'cookie'};

            const handler = new PubcidHandler(options);
            let pubcid = handler.fetchPubcid();
            expect(pubcid).to.match(uuidPattern);

            cookieSpy.resetHistory();
            handler.fetchPubcid();
            sinon.assert.callCount(cookieSpy, 1);
            sinon.assert.callCount(pixelSpy, 0);
        });

        it('extend is disabled', () => {
            const options = {type: 'cookie', extend: false};

            const handler = new PubcidHandler(options);
            let pubcid = handler.fetchPubcid();
            expect(pubcid).to.match(uuidPattern);

            cookieSpy.resetHistory();
            handler.fetchPubcid();
            sinon.assert.callCount(cookieSpy, 0);
            sinon.assert.callCount(pixelSpy, 0);
        });

        it('fire pixel once', () => {
            const options = {type: 'cookie', extend: false, pixelUrl: '/any/url/'};

            const handler = new PubcidHandler(options);
            let pubcid = handler.fetchPubcid();
            expect(pubcid).to.match(uuidPattern);
            sinon.assert.callCount(cookieSpy, 1);
            sinon.assert.callCount(pixelSpy, 1);

            expect(pixelSpy.getCall(0).args[0]).to.equal('/any/url/?id=' + encodeURIComponent('pubcid:' + pubcid));

            // There should be no increment in counts after the 2nd call
            handler.fetchPubcid();
            sinon.assert.callCount(cookieSpy, 1);
            sinon.assert.callCount(pixelSpy, 1);
        });

        it('fire pixel every time', () => {
            const options = {type: 'cookie', extend: true, pixelUrl: '/any/url/'};

            const handler = new PubcidHandler(options);
            let pubcid = handler.fetchPubcid();
            expect(pubcid).to.match(uuidPattern);
            sinon.assert.callCount(cookieSpy, 1);
            sinon.assert.callCount(pixelSpy, 1);

            expect(pixelSpy.getCall(0).args[0]).to.equal('/any/url/?id=' + encodeURIComponent('pubcid:' + pubcid));

            // There should be an increment in firePixel count only
            let pubcid2 = handler.fetchPubcid();
            sinon.assert.callCount(cookieSpy, 1);
            sinon.assert.callCount(pixelSpy, 2);
            expect(pixelSpy.getCall(1).args[0]).to.equal('/any/url/?id=' + encodeURIComponent('pubcid:' + pubcid2));
        });
    });
});