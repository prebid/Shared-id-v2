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

        storage.deleteValue(COOKIE, keyName);

        expect(cookieStub).to.have.been.calledOnceWith(keyName);
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

        storage.writeValue(COOKIE, keyName, value, interval);

        expect(cookieStub).to.have.been.calledOnceWith(keyName, value, interval);
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
