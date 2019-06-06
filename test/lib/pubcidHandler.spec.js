import PubcidHandler from '../../src/lib/pubcidHandler';
import * as cookieUtils from "../../src/lib/cookieUtils";
import * as utils from '../../src/lib/utils';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89a-f][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('PubcidHandler', ()=> {

    const DEFAULT_NAME = '_pubcid';
    const DEFAULT_OPTOUT_NAME = '_pubcid_optout';

    function clearAll() {
        cookieUtils.clearAllCookies();

        if (window.localStorage) {
            window.localStorage.clear();
        }
    }

    describe("storage operations", ()=> {
        beforeAll(()=>{
            clearAll();
        });

        afterEach(() => {
            clearAll();
        });

        it('default opt-in', () => {
            const handler = new PubcidHandler();
            const pubcid = handler.fetchPubcid();
            expect(pubcid).toMatch(uuidPattern);

            const storedValue = window.localStorage.getItem(DEFAULT_NAME);
            expect(storedValue).toEqual(pubcid);

            const pubcid2 = handler.fetchPubcid();
            expect(pubcid2).toEqual(pubcid);
        });

        it('default opt-out', () => {
            cookieUtils.setCookie(DEFAULT_OPTOUT_NAME, 1, 50);

            const handler = new PubcidHandler();
            const pubcid = handler.fetchPubcid();

            expect(pubcid).toBeNull();

            const storedValue = window.localStorage.getItem(DEFAULT_NAME);
            expect(storedValue).toBeNull();
        });

        it('with consent', () => {
            const consent = {
                getVendorConsents: {
                    gdprApplies: true,
                    purposeConsents: {
                        1: true
                    }
                }
            };

            const handler = new PubcidHandler();
            const pubcid = handler.fetchPubcid(consent);

            expect(pubcid).toMatch(uuidPattern);
        });

        it('without consent', () => {
            const consent = {
                getVendorConsents: {
                    gdprApplies: true,
                    purposeConsents: {
                        1: false
                    }
                }
            };

            const handler = new PubcidHandler();
            const pubcid = handler.fetchPubcid(consent);

            expect(pubcid).toBeNull();
        });

        it('change cookie name', () => {
            const cookieName = 'abc';
            const options = {name: cookieName};

            const handler = new PubcidHandler(options);
            const pubcid = handler.fetchPubcid();
            expect(pubcid).toMatch(uuidPattern);

            // local storage should have precedence.  so
            // cookie is not updated.
            const val = cookieUtils.getCookie(cookieName);
            expect(val).toBeNull();
        });

        xit('disabled', () => {
            const options = {enabled: false};

            const handler = new PubcidHandler(options);
            const pubcid = handler.fetchPubcid();
            expect(pubcid).toBeUndefined();

            const storedValue = window.localStorage.getItem(DEFAULT_NAME);
            expect(storedValue).toBeNull();
        });

        it('cookie read only', () => {
            const options = {type: 'cookie', create: false};

            const handler = new PubcidHandler(options);
            let pubcid = handler.fetchPubcid();

            expect(pubcid).toBeNull();

            cookieUtils.setCookie(DEFAULT_NAME, 'abc', 10);
            pubcid = handler.fetchPubcid();
            expect(pubcid).toEqual('abc');

            const storedValue = window.localStorage.getItem(DEFAULT_NAME);
            expect(storedValue).toBeNull();
        });

        it('accidental write of undefined', () => {
            const key = 'test';

            const handler = new PubcidHandler();
            handler.writeValue(key, undefined);
            const val = localStorage.getItem(key);

            expect(val).toBeNull();

        });

        it('bad id recovery', () => {
            cookieUtils.setCookie(DEFAULT_NAME, 'undefined', 10);

            const handler = new PubcidHandler();
            const pubcid = handler.fetchPubcid();

            expect(pubcid).toMatch(uuidPattern);
        });

        it('cookie only', () => {
            const handler = new PubcidHandler({type: 'cookie'});
            const pubcid = handler.fetchPubcid();
            expect(pubcid).toMatch(uuidPattern);

            const storedValue = window.localStorage.getItem(DEFAULT_NAME);
            expect(storedValue).toBeNull();

            const pubcid2 = handler.fetchPubcid();
            expect(pubcid2).toEqual(pubcid);
        });

        it('storage only', () => {
            const handler = new PubcidHandler({type: 'html5'});
            const pubcid = handler.fetchPubcid();
            expect(pubcid).toMatch(uuidPattern);

            const cookieValue = cookieUtils.getCookie(DEFAULT_NAME);
            expect(cookieValue).toBeNull();

            const pubcid2 = handler.fetchPubcid();
            expect(pubcid2).toEqual(pubcid);
        });

        it('local storage first', () => {
            const handler = new PubcidHandler({type: ' html5,cookie'});
            const pubcid = handler.fetchPubcid();
            expect(pubcid).toMatch(uuidPattern);

            const storedValue = window.localStorage.getItem(DEFAULT_NAME);
            expect(storedValue).toEqual(pubcid);

            const cookieValue = cookieUtils.getCookie(DEFAULT_NAME);
            expect(cookieValue).toBeNull();

            const pubcid2 = handler.fetchPubcid();
            expect(pubcid2).toEqual(pubcid);
        });

        it('cookie first', () => {
            const handler = new PubcidHandler({type: 'cookie ,html5'});
            const pubcid = handler.fetchPubcid();
            expect(pubcid).toMatch(uuidPattern);

            const storedValue = window.localStorage.getItem(DEFAULT_NAME);
            expect(storedValue).toBeNull();

            const cookieValule = cookieUtils.getCookie(DEFAULT_NAME);
            expect(cookieValule).toEqual(pubcid);

            const pubcid2 = handler.fetchPubcid();
            expect(pubcid2).toEqual(pubcid);
        });

        it('copy cookie value to storage', () => {
            const expectedValue = 'this-is-cookie';
            const handler = new PubcidHandler();

            // set up cookie value
            cookieUtils.setCookie(DEFAULT_NAME, expectedValue, 60);
            const pubcid = handler.fetchPubcid();
            // pubcid should come from cookie
            expect(pubcid).toEqual(expectedValue);
            // check local storage
            const storedValue = window.localStorage.getItem(DEFAULT_NAME);
            expect(storedValue).toEqual(expectedValue);
        });

        it('avoid copying storage value to cookie', () => {
            const expectedValue = 'this-is-storage';
            const handler = new PubcidHandler();

            // set up storage value
            window.localStorage.setItem(DEFAULT_NAME, expectedValue);
            const pubcid = handler.fetchPubcid();
            // pubcid should come from storage
            expect(pubcid).toEqual(expectedValue);
            // check cookie
            const cookieValue = cookieUtils.getCookie(DEFAULT_NAME);
            expect(cookieValue).toBeNull();
        });

    });

    describe('pixels and extend', ()=>{
        beforeAll(()=>{
            spyOn(utils, 'firePixel');
            spyOn(cookieUtils, 'setCookie').and.callThrough();
            clearAll();
        });

        beforeEach(() => {
            utils.firePixel.calls.reset();
            cookieUtils.setCookie.calls.reset();
        });

        afterEach(() => {
            clearAll();
        });

        it('extend is enabled', () => {
            const options = {type: 'cookie'};

            const handler = new PubcidHandler(options);
            let pubcid = handler.fetchPubcid();
            expect(pubcid).toMatch(uuidPattern);

            cookieUtils.setCookie.calls.reset();
            let pubcid2 = handler.fetchPubcid();

            expect(cookieUtils.setCookie.calls.count()).toEqual(1);
            expect(utils.firePixel.calls.any()).toEqual(false);
        });

        it('extend is disabled', () => {
            const options = {type: 'cookie', extend: false};

            const handler = new PubcidHandler(options);
            let pubcid = handler.fetchPubcid();
            expect(pubcid).toMatch(uuidPattern);

            cookieUtils.setCookie.calls.reset();
            let pubcid2 = handler.fetchPubcid();

            expect(cookieUtils.setCookie.calls.any()).toEqual(false);
            expect(utils.firePixel.calls.any()).toEqual(false);
        });

        it('fire pixel once', () => {
            const options = {type: 'cookie', extend: false, pixelUrl: '/any/url/'};

            const handler = new PubcidHandler(options);
            let pubcid = handler.fetchPubcid();
            expect(pubcid).toMatch(uuidPattern);
            expect(utils.firePixel.calls.count()).toEqual(1);
            expect(cookieUtils.setCookie.calls.count()).toEqual(1);

            expect(utils.firePixel.calls.argsFor(0)).toEqual(['/any/url/?id=' + encodeURIComponent('pubcid:' + pubcid)]);

            // There should be no increment in counts after the 2nd call
            let pubcid2 = handler.fetchPubcid();
            expect(utils.firePixel.calls.count()).toEqual(1);
            expect(cookieUtils.setCookie.calls.count()).toEqual(1);
        });

        it('fire pixel every time', () => {
            const options = {type: 'cookie', extend: true, pixelUrl: '/any/url/'};

            const handler = new PubcidHandler(options);
            let pubcid = handler.fetchPubcid();
            expect(pubcid).toMatch(uuidPattern);
            expect(utils.firePixel.calls.count()).toEqual(1);
            expect(cookieUtils.setCookie.calls.count()).toEqual(1);

            expect(utils.firePixel.calls.argsFor(0)).toEqual(['/any/url/?id=' + encodeURIComponent('pubcid:' + pubcid)]);

            // There should be an increment in firePixel count only
            let pubcid2 = handler.fetchPubcid();
            expect(utils.firePixel.calls.count()).toEqual(2);
            expect(cookieUtils.setCookie.calls.count()).toEqual(1);
            expect(utils.firePixel.calls.argsFor(1)).toEqual(['/any/url/?id=' + encodeURIComponent('pubcid:' + pubcid2)]);
        });
    });
});