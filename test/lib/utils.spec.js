import {expect} from 'chai';
import {uuid4, parseQueryString, addQueryParam, copyOptions} from '../../src/lib/utils';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89a-f][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('When util is used', () => {
  it('should create valid uuid', () => {
    const id = uuid4();
    expect(id).to.match(uuidPattern);
  });

  it ('should create distinct uuid', () => {
    const set = {};
    for (let i = 0; i < 100; ++i) {
      const uuid = uuid4();
      expect(uuid).to.match(uuidPattern);
      expect(set[uuid]).not.exist;
      set[uuid] = true;
    }
    expect(Object.keys(set).length).to.equal(100);
  });
});

describe('parseQueryString', ()=>{
  it('without leading question mark', ()=>{
    const params = parseQueryString('a=1&_b=2&c=');
    expect(params).exist;
    expect(params.a).to.equal('1');
    expect(params._b).to.equal('2');
    expect(params.c).to.equal('');
    expect(params.d).not.exist;
    expect(params['']).not.exist;
  });

  it('with leading question mark', ()=>{
    const params = parseQueryString('?a=1&b=2&c=&d=4');
    expect(params).exist;
    expect(params.a).to.equal('1');
    expect(params.b).to.equal('2');
    expect(params.c).to.equal('');
    expect(params.d).to.equal('4');
  });

  it('urlencoded', ()=>{
    const params = parseQueryString('a=1&b=hello%20%3Cworld%3E&c=3');
    expect(params).exist;
    expect(params.a).to.equal('1');
    expect(params.b).to.equal('hello <world>');
  });

});

describe('query param', () => {
  it('add param', () => {
    const url = addQueryParam('/hello/world/', 'car', 'ford');
    expect(url).to.equal('/hello/world/?car=ford');
  });
  it('add param to other params', ()=>{
    const url = addQueryParam('/hello/world/?color=blue&model=f150', 'car', 'ford');
    expect(url).to.equal('/hello/world/?color=blue&model=f150&car=ford');
  });
  it('replace param', ()=>{
    const url = addQueryParam('/hello/world/?color=blue&car=chevy&type=truck', 'car', 'ford');
    expect(url).to.equal('/hello/world/?color=blue&car=ford&type=truck');
  });
  it('with hash', ()=>{
    const url = addQueryParam('http://example.com/hello/world/?color=blue&car=chevy&type=truck#price', 'car', 'ford');
    expect(url).to.equal('http://example.com/hello/world/?color=blue&car=ford&type=truck#price');
  });
});

describe('copyOptions', ()=>{
  it('copy undefined', ()=>{
    const dst = {a: 1};
    copyOptions(dst);
    expect(dst).deep.equal({a: 1});
  });

  it('copy empty', ()=>{
    const dst = {a: 1};
    copyOptions(dst, {});
    expect(dst).deep.equal({a: 1});
  });

  it('copy values', ()=>{
    const dst = {a: 1, b: 'hello', c: 100, d: 'purple' };
    const src = {a: 2, b: 'world', x: -1, d: undefined };
    copyOptions(dst, src);
    expect(dst).deep.equal({a: 2, b: 'world', c:100 , d: 'purple'});
  });
});