import {expect} from 'chai';
import sinon from "sinon";
import * as storage from '../../src/lib/storageUtils';

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