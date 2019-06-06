import * as cookie from '../../src/lib/cookieUtils';

describe('Cookie operation', () => {
    it('should read/write', () => {
        cookie.setCookie('hello', 'world', 10);
        let val = cookie.getCookie('hello');
        expect(val).toBe('world');
    });

    it('should delete', () => {
        const name = 'hello';
        cookie.setCookie(name, 'earth', 10);
        let val = cookie.getCookie(name);
        expect(val).toBeDefined();
        cookie.delCookie(name);
        val = cookie.getCookie(name);
        expect(val).toBeNull();
    })
});