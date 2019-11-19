import {expect} from 'chai';
import * as cookie from '../../src/lib/cookieUtils';

describe('Cookie operation', () => {
    it('should read/write', () => {
        cookie.setCookie('hello', 'world', 10);
        let val = cookie.getCookie('hello');
        expect(val).to.equal('world');
    });

    it('should delete', () => {
        const name = 'hello';
        cookie.setCookie(name, 'earth', 10);
        let val = cookie.getCookie(name);
        expect(val).exist;
        cookie.delCookie(name);
        val = cookie.getCookie(name);
        expect(val).to.be.null;
    })
});