import chai from 'chai';
import sinon from "sinon";
import sinonChai from 'sinon-chai';
import PubcidHandler from '../../src/lib/pubcidHandler';
import * as cookieUtils from "../../src/lib/cookieUtils";
import * as storageUtils from '../../src/lib/storageUtils';
import * as utils from '../../src/lib/utils';
import {TCF_API} from '../../src/lib/consenthandler/drivers/tcf';
import {COOKIE, LOCAL_STORAGE} from '../../src/lib/constants';

chai.use(sinonChai);
const expect = chai.expect;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89a-f][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('PubcidHandler', ()=> {

    const DEFAULT_NAME = '_pubcid';
    const DEFAULT_OPTOUT_NAME = '_pubcid_optout';

    function clearAll() {
        cookieUtils.clearAllCookies(window.location.hostname);
        cookieUtils.clearAllCookies();

        if (window.localStorage) {
            window.localStorage.clear();
        }
    }

    describe('check iab consents', ()=> {
        before(() => {
            clearAll();
        });

        afterEach(() => {
            if (window[TCF_API]) delete window[TCF_API];
            clearAll();
        });

        describe("TCF enabled", () => {

            function mockResult(hasConsent) {
                return {
                    cmpStatus: 'loaded',
                    eventStatus: 'tcloaded',
                    gdprApplies: true,
                    purpose: {consents: {1: hasConsent}}
                };
            }

            const options = {consent: {type: 'iab'}};
            it('with consent', () => {
                window[TCF_API] = (cmd, args, callback) => {
                    callback(mockResult(true), true);
                };

                const handler = new PubcidHandler(options);
                handler.fetchPubcid();

                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(handler.readPubcid());
                    }, 200);
                }).then((pubcid) => {
                    expect(pubcid).to.match(uuidPattern);
                });
            });

            it('without consent', () => {
                window[TCF_API] = (cmd, args, callback) => {
                    callback(mockResult(false), true);
                };

                const handler = new PubcidHandler(options);
                handler.fetchPubcid();

                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(handler.readPubcid());
                    }, 200);
                }).then((pubcid) => {
                    expect(pubcid).to.be.null;
                });
            });

            it('without consent and existing pubcids in cookie and local storage', () => {
                // Given a mock TCF that returns no consent
                window[TCF_API] = (cmd, args, callback) => {
                    callback(mockResult(false), true);
                };

                // And existing pubcids stored in both cookie and local storage
                cookieUtils.setCookie(DEFAULT_NAME, 'existing', 30);
                window.localStorage.setItem(DEFAULT_NAME, 'another_existing');

                // When fetchPubcid is called
                const handler = new PubcidHandler({consent: {type: 'iab'}, cookieDomain: ''} );
                handler.fetchPubcid();

                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(handler.readPubcid());
                    }, 200);
                }).then((pubcid) => {
                    // Then no pubcid value can be read
                    expect(pubcid).to.be.null;
                    // And pubcid are erased from both locations
                    const cookieValue = cookieUtils.getCookie(DEFAULT_NAME);
                    expect(cookieValue).to.be.null;
                    const storageValue = window.localStorage.getItem(DEFAULT_NAME);
                    expect(storageValue).to.be.null;
                });
            });

            it('TCF failed', () => {
                window[TCF_API] = (cmd, args, callback) => {
                    callback(mockResult(true), false);
                };

                const handler = new PubcidHandler({consent: {type: 'iab', alwaysCallback: false}});
                handler.fetchPubcid();

                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(handler.readPubcid());
                    }, 200);
                }).then((pubcid) => {
                    expect(pubcid).to.be.null;
                });
            });
        });

        describe("iab disabled", () => {
            it('with consent', () => {
                window[TCF_API] = (cmd, args, callback) => {
                    callback(mockResult(true), true);
                };
                const handler = new PubcidHandler();
                handler.fetchPubcid();

                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(handler.readPubcid());
                    }, 200);
                }).then((pubcid) => {
                    expect(pubcid).to.match(uuidPattern);
                });
            });

            it('without consent', () => {
                window[TCF_API] = (cmd, args, callback) => {
                    callback({gdprApplies: true, publisher: {consents: {1: false}}});
                    callback(mockResult(false), true);
                };

                const handler = new PubcidHandler();
                handler.fetchPubcid();

                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(handler.readPubcid());
                    }, 200);
                }).then((pubcid) => {
                    expect(pubcid).to.match(uuidPattern);
                });
            });
        });
    });

    describe('check optout', ()=> {
        before(()=>{
            clearAll();
        });

        afterEach(()=>{
           clearAll();
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

        it('default optout', () => {
            cookieUtils.setCookie(DEFAULT_OPTOUT_NAME, 1, 50);

            const handler = new PubcidHandler();
            const pubcid = handler.fetchPubcid();

            expect(pubcid).to.be.null;

            const storedValue = window.localStorage.getItem(DEFAULT_NAME);
            expect(storedValue).to.be.null;
        });

        it('Local storage optout with existing cookie', () => {
            // Given a pubcid saved as cookie and optout in local storage
            const pubcidValue = 'existing1';
            cookieUtils.setCookie(DEFAULT_NAME, pubcidValue, 60);
            window.localStorage.setItem(DEFAULT_OPTOUT_NAME, 1);

            // When fetchPubcid is called
            const handler = new PubcidHandler({type: LOCAL_STORAGE, cookieDomain: ''});
            const pubcid = handler.fetchPubcid();

            // Then no pubcid should be returned
            expect(pubcid).to.be.null;

            // And pubcid should be removed from both cookie and local storage
            const storedValue = window.localStorage.getItem(DEFAULT_NAME);
            expect(storedValue).to.be.null;
            const cookieValue = cookieUtils.getCookie(DEFAULT_NAME);
            expect(cookieValue).to.be.null;
        });

        it('Cookie optout with existing local storage', () => {
            // Given a pubcid saved as cookie and optout in local storage
            const pubcidValue = 'existing2';
            window.localStorage.setItem(DEFAULT_NAME, pubcidValue);
            cookieUtils.setCookie(DEFAULT_OPTOUT_NAME, 1, 50);

            // When fetchPubcid is called
            const handler = new PubcidHandler({type: COOKIE});
            const pubcid = handler.fetchPubcid();

            // Then no pubcid should be returned
            expect(pubcid).to.be.null;

            // And pubcid should be removed from both cookie and local storage
            const storedValue = window.localStorage.getItem(DEFAULT_NAME);
            expect(storedValue).to.be.null;
            const cookieValue = cookieUtils.getCookie(DEFAULT_NAME);
            expect(cookieValue).to.be.null;
        });
    });

    describe('fetchPubcid', ()=>{
        before(()=>{
            clearAll();
        });

        afterEach(()=>{
            clearAll();
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
            const options = {type: COOKIE, create: false};

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

            storageUtils.writeValue(LOCAL_STORAGE, key, undefined);
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
            const handler = new PubcidHandler({type: COOKIE});
            const pubcid = handler.fetchPubcid();
            expect(pubcid).to.match(uuidPattern);

            const storedValue = window.localStorage.getItem(DEFAULT_NAME);
            expect(storedValue).to.be.null;

            const pubcid2 = handler.fetchPubcid();
            expect(pubcid2).to.equal(pubcid);
        });

        it('local storage only', () => {
            const handler = new PubcidHandler({type: LOCAL_STORAGE});
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

    describe('updatePubcidWithConsent', ()=>{
        before(()=>{
            clearAll();
        });

        afterEach(()=>{
            clearAll();
        });

        it('create with consent', (done)=>{
            // Given a default handler with no existing pubcid
            const handler = new PubcidHandler();
            // When updatePubcidWithConsent is called
            handler.updatePubcidWithConsent((pubcid)=>{
                // Then a new pubcid is generated and passed to the callback
                expect(pubcid).to.match(uuidPattern);
                done();
            });
        });

        it('create without consent', (done)=>{
            // Given a default handler with no existing pubcid but with optout
            const handler = new PubcidHandler();
            cookieUtils.setCookie(DEFAULT_OPTOUT_NAME, 1, 30);
            // When updatePubcidWithConsent is called
            handler.updatePubcidWithConsent((pubcid)=>{
                // Then callback receives null as pubcid
                expect(pubcid).to.be.null;
                done();
            });
        });

        it('existing pubcid with consent', (done)=>{
            // Given a default handler with existing pubcid
            const handler = new PubcidHandler();
            const expected = 'testUpdate1';
            window.localStorage.setItem(DEFAULT_NAME, expected);
            // When updatePubcidWithConsent is called
            handler.updatePubcidWithConsent((pubcid)=>{
                // Then callback receives the existing pubcid value
                expect(pubcid).to.equal(expected);
                // And the stored value remain unchanged
                const storedValue = window.localStorage.getItem(DEFAULT_NAME);
                expect(storedValue).to.equal(expected);
                done();
            });
        });

        it('existing pubcid without consent', (done)=>{
            // Given a default handler with existing pubcid, but without consent
            const handler = new PubcidHandler({cookieDomain: ''});
            cookieUtils.setCookie(DEFAULT_NAME, 'some_random_value', 30);
            cookieUtils.setCookie(DEFAULT_OPTOUT_NAME, 1, 30);
            // When updatePubcidWithConsent is called
            handler.updatePubcidWithConsent((pubcid)=>{
                // Then callback receives null as pubcid value
                expect(pubcid).to.be.null;
                // And stored value is also deleted
                const storedValue = cookieUtils.getCookie(DEFAULT_NAME);
                expect(storedValue).to.be.null;
                done();
            });
        });
    });

    describe('readPubcidWithConsent', ()=>{
        before(()=>{
            clearAll();
        });

        afterEach(()=>{
            clearAll();
        });

        it('read with consent', (done)=>{
            // Given a default handler with no existing pubcid
            const handler = new PubcidHandler();
            // When readPubcidWithConsent is called
            handler.readPubcidWithConsent((pubcid)=>{
                // Then callback receives null as pubcid
                expect(pubcid).to.be.null;
                done();
            });
        });

        it('read without consent', (done)=>{
            // Given a default handler with no existing pubcid, but with an optout
            const handler = new PubcidHandler();
            cookieUtils.setCookie(DEFAULT_OPTOUT_NAME, 1, 30);
            // When readPubcidWithConsent is called
            handler.readPubcidWithConsent((pubcid)=>{
                // Then callback receives null as pubcid
                expect(pubcid).to.be.null;
                done();
            });
        });

        it('existing pubcid with consent', (done)=>{
            // Given a default handler with existing pubcid
            const handler = new PubcidHandler();
            const expected = 'testRead1';
            window.localStorage.setItem(DEFAULT_NAME, expected);
            // When readPubcidWithConsent is called
            handler.readPubcidWithConsent((pubcid)=>{
                // Then expected pubcid is received by the callback
                expect(pubcid).to.equal(expected);
                // And the stored value remain unchanged
                const storedValue = window.localStorage.getItem(DEFAULT_NAME);
                expect(storedValue).to.equal(expected);
                done();
            });
        });

        it('existing pubcid without consent', (done)=>{
            // Given a default handler with existing pubcid and optout
            const handler = new PubcidHandler();
            const expected = 'testRead2';
            cookieUtils.setCookie(DEFAULT_NAME, expected, 30);
            cookieUtils.setCookie(DEFAULT_OPTOUT_NAME, 1, 30);
            // When readPubcidWithConsent is called
            handler.readPubcidWithConsent((pubcid)=>{
                // Then callback receives a null
                expect(pubcid).to.be.null;
                // And the stored value remain unchanged
                const storedValue = cookieUtils.getCookie(DEFAULT_NAME);
                expect(storedValue).to.equal(expected);
                done();
            });
        });
    });

    describe('pixels and extend', ()=>{
        let pixelStub, cookieSpy;
        before(()=>{
            pixelStub = sinon.stub(utils, 'firePixel');
            cookieSpy = sinon.spy(cookieUtils, 'setCookie');
            clearAll();
        });

        after(()=>{
            pixelStub.restore();
            cookieSpy.restore();
        })

        beforeEach(() => {
            pixelStub.resetHistory();
            cookieSpy.resetHistory();
        });

        afterEach(() => {
            clearAll();
        });

        it('extend is enabled', () => {
            const options = {type: COOKIE, cookieDomain: ''};

            const handler = new PubcidHandler(options);
            let pubcid = handler.fetchPubcid();
            expect(pubcid).to.match(uuidPattern);

            cookieSpy.resetHistory();
            handler.fetchPubcid();
            sinon.assert.callCount(cookieSpy, 1);
            sinon.assert.callCount(pixelStub, 0);
        });

        it('extend is disabled', () => {
            const options = {type: COOKIE, extend: false};

            const handler = new PubcidHandler(options);
            let pubcid = handler.fetchPubcid();
            expect(pubcid).to.match(uuidPattern);

            cookieSpy.resetHistory();
            handler.fetchPubcid();
            sinon.assert.callCount(cookieSpy, 0);
            sinon.assert.callCount(pixelStub, 0);
        });

        it('fire pixel once', () => {
            const options = {type: COOKIE, extend: false, pixelUrl: '/any/url/', cookieDomain: ''};

            const handler = new PubcidHandler(options);
            let pubcid = handler.fetchPubcid();
            expect(pubcid).to.match(uuidPattern);
            sinon.assert.callCount(cookieSpy, 1);
            sinon.assert.callCount(pixelStub, 1);
            expect(cookieSpy.getCall(0).args[0]).to.equal('_pubcid');

            expect(pixelStub.getCall(0).args[0]).to.equal('/any/url/?id=' + encodeURIComponent('pubcid:' + pubcid));

            // There should be no increment in counts after the 2nd call
            handler.fetchPubcid();
            sinon.assert.callCount(cookieSpy, 1);
            sinon.assert.callCount(pixelStub, 1);
            expect(cookieSpy.getCall(0).args[0]).to.equal('_pubcid');

        });

        it('fire pixel every time', () => {
            const options = {type: COOKIE, extend: true, pixelUrl: '/any/url/', cookieDomain: ''};

            const handler = new PubcidHandler(options);
            let pubcid = handler.fetchPubcid();
            expect(pubcid).to.match(uuidPattern);
            sinon.assert.callCount(cookieSpy, 1);
            sinon.assert.callCount(pixelStub, 1);

            expect(pixelStub.getCall(0).args[0]).to.equal('/any/url/?id=' + encodeURIComponent('pubcid:' + pubcid));

            // There should be an increment in firePixel count only
            let pubcid2 = handler.fetchPubcid();
            sinon.assert.callCount(cookieSpy, 1);
            sinon.assert.callCount(pixelStub, 2);
            expect(pixelStub.getCall(1).args[0]).to.equal('/any/url/?id=' + encodeURIComponent('pubcid:' + pubcid2));
        });
    });

    describe('getDomain', ()=>{
        let stub;

        afterEach(()=>{
            if (stub) stub.restore();
        });

        it('has cookieDomain', ()=>{
            const expected = 'hello.cookie'
            stub = sinon.stub(storageUtils, 'extractDomain');
            const options = {cookieDomain: expected};
            const handler = new PubcidHandler(options);
            const domain = handler.getDomain(COOKIE);
            expect(domain).to.equal(expected);
            expect(stub).to.have.not.been.called;
        });

        it('call extractDomain', ()=>{
            const expected = 'test123.com'
            stub = sinon.stub(storageUtils, 'extractDomain').callsFake(()=>{return expected});
            const handler = new PubcidHandler();
            const domain = handler.getDomain(COOKIE);
            expect(stub).to.have.been.calledOnce;
            expect(domain).to.equal(expected);
            expect(handler.cachedDomain).to.equal(expected);
        });

        it('use cachedDomain', ()=>{
            const expected = 'abcd.org'
            stub = sinon.stub(storageUtils, 'extractDomain');
            const handler = new PubcidHandler();
            handler.cachedDomain = expected;
            const domain = handler.getDomain(COOKIE);
            expect(domain).to.equal(expected);
            expect(stub).to.have.not.been.called;
        });

        it('non-cookie storage', ()=>{
            const expected = 'bogus.com'
            stub = sinon.stub(storageUtils, 'extractDomain').callsFake(()=>{return expected});
            const handler = new PubcidHandler();
            const domain = handler.getDomain(LOCAL_STORAGE);
            expect(stub).to.have.been.not.been.called;
            expect(domain).to.be.undefined;
        });
    });
});
