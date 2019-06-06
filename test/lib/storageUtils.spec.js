import * as storage from '../../src/lib/storageUtils';

describe('StorageUtils operations', ()=>{
    afterEach(()=>{
        storage.clearStorage();
    });

    it('localStorage available', ()=>{
        expect(storage.isStorageSupported('localStorage')).toEqual(true);
    });


    it('localStorage unavailable', ()=>{
        spyOn(window.localStorage, 'setItem').and.throwError(new DOMException('test'));
        expect(storage.isStorageSupported('localStorage')).toEqual(false);
    });

    it('getStorageItem exception', ()=>{
        spyOn(window.localStorage, 'getItem').and.throwError(new DOMException('test'));
        expect(storage.getStorageItem('check')).toBeNull();
    });

    it('check setStorageItem', ()=>{
        const key = 'check_set';
        const val = 'test';

        const now = Date.now();
        storage.setStorageItem(key, val, 5);

        const expVal = localStorage.getItem(key + '_exp');
        const storedVal = localStorage.getItem(key);

        expect(expVal).not.toBeNull();
        expect(storedVal).not.toBeNull();

        const expDate = new Date(expVal);

        // Compare time based on seconds and allow tolerance on ones place, eg 100 ~= 102.
        expect((expDate.getTime() - now)/1000).toBeCloseTo(5 * 60, -1);
        expect(storedVal).toEqual(val);
    });


    it('check getStorageItem and removeStorageItem', ()=>{
        const key = 'check_get';
        const val = 'test';

        storage.setStorageItem(key, val, 10);
        expect(storage.getStorageItem(key)).toEqual(val);

        storage.removeStorageItem(key);
        expect(storage.getStorageItem(key)).toBeNull();
    });

    it('check expiry', ()=>{
        const key = 'check_expiry';
        const val = 'test';

        storage.setStorageItem(key, val, -1);

        expect(localStorage.getItem(key)).toEqual(val);
        expect(storage.getStorageItem(key)).toBeNull();
        expect(localStorage.getItem(key)).toBeNull();
    });

    it('store url', ()=>{
        const key = 'store_url';
        const val = 'http://example.com/test?hello=world';

        storage.setStorageItem(key, val, 100);

        expect(storage.getStorageItem(key)).toEqual(val);
    });
});