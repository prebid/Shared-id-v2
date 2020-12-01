import chai from 'chai';
import sinon from "sinon";
import sinonChai from 'sinon-chai';
import * as storage from '../../src/lib/storageUtils';
import * as cookieUtils from "../../src/lib/cookieUtils";
import {COOKIE, LOCAL_STORAGE} from "../../src/lib/constants";

chai.use(sinonChai);
const expect = chai.expect;

describe('StorageUtils operations', ()=>{
    afterEach(()=>{
        storage.clearStorage();
    });

    it('localStorage available', ()=>{
        expect(storage.isStorageSupported('localStorage')).to.equal(true);
    });


    it('localStorage unavailable', ()=>{
        const stub = sinon.stub(Storage.prototype, 'setItem').throws();
        expect(storage.isStorageSupported('localStorage')).to.equal(false);
        stub.restore();
    });

    it('getStorageItem exception', ()=>{
        const stub = sinon.stub(Storage.prototype, 'getItem').throws();
        expect(storage.getStorageItem('check')).to.be.null;
        stub.restore();
    });

    it('check setStorageItem', ()=>{
        const key = 'check_set';
        const val = 'test';

        const now = Date.now();
        storage.setStorageItem(key, val, 5);

        const expVal = localStorage.getItem(key + '_exp');
        const storedVal = localStorage.getItem(key);

        expect(expVal).not.to.be.null;
        expect(storedVal).not.to.be.null;

        const expDate = new Date(expVal);

        // Compare time based on seconds and allow tolerance on ones place, eg 100 ~= 102.
        expect((expDate.getTime() - now)/1000).to.be.closeTo(5 * 60, 1);
        expect(storedVal).to.equal(val);
    });


    it('check getStorageItem and removeStorageItem', ()=>{
        const key = 'check_get';
        const val = 'test';

        storage.setStorageItem(key, val, 10);
        expect(storage.getStorageItem(key)).to.equal(val);

        storage.removeStorageItem(key);
        expect(storage.getStorageItem(key)).to.be.null;
    });

    it('check expiry', ()=>{
        const key = 'check_expiry';
        const val = 'test';

        storage.setStorageItem(key, val, -1);

        expect(localStorage.getItem(key)).to.equal(val);
        expect(storage.getStorageItem(key)).to.be.null;
        expect(localStorage.getItem(key)).to.be.null;
    });

    it('store url', ()=>{
        const key = 'store_url';
        const val = 'http://example.com/test?hello=world';

        storage.setStorageItem(key, val, 100);

        expect(storage.getStorageItem(key)).to.equal(val);
    });
});

describe('value functions', ()=>{

    it('readValue cookie', ()=>{
        const cookieStub = sinon.stub(cookieUtils, 'getCookie');
        const storageStub = sinon.stub(Storage.prototype, 'getItem');
        const keyName = 'ANY_KEY';

        storage.readValue(COOKIE, keyName);

        expect(cookieStub).to.have.been.calledOnceWith(keyName);
        expect(storageStub).to.have.not.been.called;
        cookieStub.restore();
        storageStub.restore();
    });

    it('readValue local storage', ()=>{
        const cookieStub = sinon.stub(cookieUtils, 'getCookie');
        const storageStub = sinon.stub(Storage.prototype, 'getItem');
        const keyName = 'ANY_KEY';

        storage.readValue(LOCAL_STORAGE, keyName);

        expect(storageStub).to.have.been.calledTwice;
        expect(storageStub.getCall(0).args[0]).to.equal(`${keyName}_exp`);
        expect(storageStub.getCall(1).args[0]).to.equal(keyName);
        expect(cookieStub).to.have.not.been.called;
        storageStub.restore();
        cookieStub.restore();
    });

    it('deleteValue cookie', ()=>{
        const cookieStub = sinon.stub(cookieUtils, 'delCookie');
        const storageStub = sinon.stub(Storage.prototype, 'removeItem');
        const keyName = 'ANY_KEY';
        const domain = 'ANY.DOMAIN';

        storage.deleteValue(COOKIE, keyName, domain);

        expect(cookieStub).to.have.been.calledOnceWith(keyName, domain);
        expect(storageStub).to.have.not.been.called;
        cookieStub.restore();
        storageStub.restore();
    });

    it('deleteValue local storage', ()=>{
        const cookieStub = sinon.stub(cookieUtils, 'delCookie');
        const storageStub = sinon.stub(Storage.prototype, 'removeItem');
        const keyName = 'ANY_KEY';

        storage.deleteValue(LOCAL_STORAGE, keyName);

        expect(storageStub).to.have.been.calledTwice;
        expect(storageStub.getCall(0).args[0]).to.equal(`${keyName}_exp`);
        expect(storageStub.getCall(1).args[0]).to.equal(keyName);
        expect(cookieStub).to.have.not.been.called;
        storageStub.restore();
        cookieStub.restore();
    });

    it('writeValue cookie', ()=>{
        const cookieStub = sinon.stub(cookieUtils, 'setCookie');
        const storageStub = sinon.stub(Storage.prototype, 'setItem');
        const keyName = 'ANY_KEY';
        const value = 'ANY_VALUE';
        const interval = 42;
        const domain = 'ANY.TEST.DOMAIN';

        storage.writeValue(COOKIE, keyName, value, interval, domain);

        expect(cookieStub).to.have.been.calledOnceWith(keyName, value, interval, domain);
        expect(storageStub).to.have.not.been.called;
        cookieStub.restore();
        storageStub.restore();
    });

    it('writeValue local storage', ()=>{
        const cookieStub = sinon.stub(cookieUtils, 'setCookie');
        const storageStub = sinon.stub(Storage.prototype, 'setItem');
        const keyName = 'ANY_KEY';
        const value = 'ANY_VALUE';
        const interval = 42;

        storage.writeValue(LOCAL_STORAGE, keyName, value, interval);

        expect(storageStub).to.have.been.calledTwice;
        expect(storageStub.getCall(0).args[0]).to.equal(`${keyName}_exp`);
        expect(storageStub.getCall(1).args[0]).to.equal(keyName);
        expect(cookieStub).to.have.not.been.called;
        storageStub.restore();
        cookieStub.restore();
    });

});

describe('extractDomain', ()=>{
    let cookies = [];
    let getStub, delStub, setStub;

    /**
     * Return a mock function for setting cookies
     * @param levels Levels of TLD.  For ex, '.com' is 1, and '.co.za' is 2.
     * @returns {function(*, *, *, *): void}
     */
    function genSetCookie(levels) {
        return (name, value, expires, domain, path) => {
            const domainParts = domain.split('.');
            if (levels > 0 && domainParts.length > levels) {
                // find existing ones first
                const element = cookies.find(e => e.name === name && e.domain === domain && e.path === path);

                if (element) {
                    element.value = value;
                }
                else {
                    const newElement = {
                        name: name,
                        value: value,
                        domain: domain,
                        path: path
                    };
                    cookies.push(newElement);
                }
            }
        }
    }

    function mockGetCookie(name) {
        const c = cookies.find(element => element.name === name);
        return c ? c.value : undefined;
    }

    function mockDelCookie(name, domain, path) {
        for (let i = 0; i < cookies.length; ++i) {
            const element = cookies[i];
            if (element.name === name && element.domain === domain && element.path === path) {
                cookies.splice(i, 1);
                break;
            }
        }
    }

    beforeEach(()=>{
       cookies = [];
       getStub = sinon.stub(cookieUtils, 'getCookie').callsFake(mockGetCookie);
       delStub = sinon.stub(cookieUtils, 'delCookie').callsFake(mockDelCookie);
    });

    afterEach(()=>{
        cookies = [];
        if (setStub) setStub.restore();
        getStub.restore();
        delStub.restore();
    });

    it('1 tld with subdomain', ()=>{
        setStub = sinon.stub(cookieUtils, 'setCookie').callsFake(genSetCookie(1));
        const domain = storage.extractDomain('www.example.com');
        expect(domain).to.equal('example.com');
        expect(cookies).to.have.lengthOf(0);
    });

    it('1 tld without subdomain', ()=>{
        setStub = sinon.stub(cookieUtils, 'setCookie').callsFake(genSetCookie(1));
        const domain = storage.extractDomain('example.com');
        expect(domain).to.equal('example.com');
        expect(cookies).to.have.lengthOf(0);
    });

    it('2 tld with subdomain', ()=>{
        setStub = sinon.stub(cookieUtils, 'setCookie').callsFake(genSetCookie(2));
        const domain = storage.extractDomain('www.example.uk.com');
        expect(domain).to.equal('example.uk.com');
        expect(cookies).to.have.lengthOf(0);
    });

    it('3 tld with subdomain', ()=>{
        setStub = sinon.stub(cookieUtils, 'setCookie').callsFake(genSetCookie(3));
        const domain = storage.extractDomain('a.b.c.kobe.jp');
        expect(domain).to.equal('b.c.kobe.jp');
        expect(cookies).to.have.lengthOf(0);
    });

    it('3 tld without subdomain', ()=>{
        setStub = sinon.stub(cookieUtils, 'setCookie').callsFake(genSetCookie(3));
        const domain = storage.extractDomain('b.c.kobe.jp');
        expect(domain).to.equal('b.c.kobe.jp');
        expect(cookies).to.have.lengthOf(0);
    });

    it('international', ()=>{
        setStub = sinon.stub(cookieUtils, 'setCookie').callsFake(genSetCookie(2));
        const domain = storage.extractDomain('www.食狮.公司.cn');
        expect(domain).to.equal('食狮.公司.cn');
        expect(cookies).to.have.lengthOf(0);
    });
});
