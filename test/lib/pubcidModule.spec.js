import {expect} from 'chai';
import {setupPubcid} from '../../src/lib/pubcidModule';
import {clearAllCookies} from "../../src/lib/cookieUtils";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89a-f][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('Standalone pubcid default', ()=>{
    after(()=>{
        window.PublisherCommonId = undefined;
        clearAllCookies();
        window.localStorage.clear();
    });

    beforeEach(()=>{
        window.PublisherCommonId = undefined;
        clearAllCookies();
        window.localStorage.clear();
    });

   it('check global object', ()=>{
        setupPubcid(window, document, {});
        expect(window.PublisherCommonId).to.exist;
        expect(typeof window.PublisherCommonId).to.equal('object');
   });

   it('auto init and get pubcid', ()=>{
        setupPubcid(window, document, {});
        const pubcid = window.PublisherCommonId.getId();
        expect(pubcid).to.match(uuidPattern);

        const pubcid2 = window.PublisherCommonId.getId();
        expect(pubcid2).to.equal(pubcid);
   });

   it('no auto init with empty pubcid', ()=>{
        setupPubcid(window, document, {autoinit: false});
        const pubcid = window.PublisherCommonId.getId();
        expect(pubcid).to.equal('');
   });

    it('generate id', ()=> {
        setupPubcid(window, document, {});
        const pubcid = window.PublisherCommonId.generateId();
        expect(pubcid).to.match(uuidPattern);
    });
});