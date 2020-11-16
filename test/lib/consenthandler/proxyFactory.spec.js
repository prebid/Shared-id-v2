import {expect} from 'chai';
import {createProxy, findCmpFrame} from "../../../src/lib/consenthandler/proxy/proxyFactory";
import {TCF_API, TCF_FRAME} from "../../../src/lib/consenthandler/drivers/tcf";

function createLocatorFrame(locatorName){
    const iframe = document.createElement('iframe');
    iframe.name = locatorName;
    document.body.appendChild(iframe);
}

function removeLocatorFrame(locatorName){
    const doc = window.document;
    const list = doc.getElementsByName(locatorName);
    const node = list[0];
    node.parentNode.removeChild(node);
}

describe('proxyFactory', ()=>{
    after(()=>{
        delete window[TCF_API];
        delete window[TCF_FRAME];
    });

    describe('findCmpFrame', ()=>{
        it('no frame', ()=>{
            const result = findCmpFrame(TCF_FRAME);
            expect(result).to.not.exist;
        });
        it('wrong frame', ()=> {
            window[TCF_FRAME] = {};
            const result = findCmpFrame("someotherframe");
            expect(result).to.not.exist;
            delete window[TCF_FRAME];
        });
        it('top frame', ()=> {
            window[TCF_FRAME] = {};
            const result = findCmpFrame(TCF_FRAME);
            expect(result).to.exist;
            delete window[TCF_FRAME];
        });
        it('sub frame', ()=> {
            createLocatorFrame(TCF_FRAME);
            const result = findCmpFrame(TCF_FRAME);
            expect(result).to.exist;
            removeLocatorFrame(TCF_FRAME);
        });
    });
    describe('CreateProxy', ()=>{
        beforeEach(() => {
            delete window[TCF_API];
            delete window[TCF_FRAME];
        });
        it('empty proxy', ()=>{
            const result = createProxy();
            expect(result).to.not.exist;
        });
        it('tcf local proxy', ()=>{
            window[TCF_API] = function(){};
            const result = createProxy();
            expect(result).to.exist;
            expect(result.driver.cmpApi).equals(TCF_API);
        });
        it('cmp local proxy', ()=>{
            var CMP_API = "__cmp";
            window[CMP_API] = function(){};
            const result = createProxy();
            expect(result).to.not.exist;
        });
        it('tcf frame proxy', ()=>{
            window[TCF_FRAME] = {};
            const result = createProxy();
            expect(result).to.exist;
            expect(result.driver.cmpApi).equals(TCF_API);
        });
    });
});
