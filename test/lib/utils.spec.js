import {uuid4, parseQueryString, addQueryParam} from '../../src/lib/utils';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89a-f][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('When util is used', () => {
   it('should create valid uuid', () => {
       const id = uuid4();
       expect(id).toMatch(uuidPattern);
   });

   it ('should create distinct uuid', () => {
       const set = {};
       for (let i = 0; i < 100; ++i) {
           const uuid = uuid4();
           expect(uuid).toMatch(uuidPattern);
           expect(set[uuid]).toBeUndefined();
           set[uuid] = true;
       }
       expect(Object.keys(set).length).toEqual(100);
   });
});

describe('parseQueryString', ()=>{
   it('without leading question mark', ()=>{
       const params = parseQueryString('a=1&_b=2&c=');
       expect(params).toBeDefined();
       expect(params.a).toEqual('1');
       expect(params._b).toEqual('2');
       expect(params.c).toEqual('');
       expect(params.d).toBeUndefined();
       expect(params['']).toBeUndefined();
   });

    it('with leading question mark', ()=>{
        const params = parseQueryString('?a=1&b=2&c=&d=4');
        expect(params).toBeDefined();
        expect(params.a).toEqual('1');
        expect(params.b).toEqual('2');
        expect(params.c).toEqual('');
        expect(params.d).toEqual('4');
    });

    it('urlencoded', ()=>{
        const params = parseQueryString('a=1&b=hello%20%3Cworld%3E&c=3');
        expect(params).toBeDefined();
        expect(params.a).toEqual('1');
        expect(params.b).toEqual('hello <world>');
    });

});

describe('query param', () => {
   it('add param', () => {
       const url = addQueryParam('/hello/world/', 'car', 'ford');
       expect(url).toEqual('/hello/world/?car=ford');
   });
   it('add param to other params', ()=>{
       const url = addQueryParam('/hello/world/?color=blue&model=f150', 'car', 'ford');
       expect(url).toEqual('/hello/world/?color=blue&model=f150&car=ford');
   });
   it('replace param', ()=>{
       const url = addQueryParam('/hello/world/?color=blue&car=chevy&type=truck', 'car', 'ford');
       expect(url).toEqual('/hello/world/?color=blue&car=ford&type=truck');
   });
   it('with hash', ()=>{
       const url = addQueryParam('http://example.com/hello/world/?color=blue&car=chevy&type=truck#price', 'car', 'ford');
       expect(url).toEqual('http://example.com/hello/world/?color=blue&car=ford&type=truck#price');
   });
});