import ConsentHandler from "../../src/lib/consentHandler";

const sampleConsentData = {
    'gdprApplies': true,
    'hasGlobalScope': false,
    'consentData': '12345_67890'
};

const sampleVendorConsents = {
    'metadata': '09876_54321'
};

const iframeConsentData = {
    'gdprApplies': true,
    'hasGlobalScope': false,
    'consentData': 'iframe_12345_67890'
};

const iframeVendorConsents = {
    'metadata': 'iframe_09876_54321'
};

describe('ConsentHandler iab', () => {
    afterEach(()=>{
        if (window.__cmp)
            delete window['__cmp'];
    });

   it('call cmp', (done)=>{
       const consentConfig = {
           type: 'iab',
           timeout: 100
       };

       window.__cmp = (cmd, arg, cb) => {
           if (cmd === 'getConsentData')
               cb(sampleConsentData);
           else if (cmd === 'getVendorConsents')
               cb(sampleVendorConsents);
       };

       const consentUtils = new ConsentHandler(consentConfig);
       consentUtils.checkConsent((resp)=>{
           expect(resp).toBeDefined();
           expect(resp.getConsentData).toBeDefined();
           expect(resp.getConsentData.gdprApplies).toEqual(true);
           expect(resp.getConsentData.consentData).toEqual('12345_67890');

           expect(resp.getVendorConsents).toBeDefined();
           expect(resp.getVendorConsents.metadata).toEqual('09876_54321');
           done();
       });
   });

   it('handles missing cmp', (done) => {
       const consentConfig = {
           type: 'iab',
           timeout: 100,
           alwaysPing: true
       };

       const consentUtils = new ConsentHandler(consentConfig);

       spyOn(consentUtils, 'handleError').and.callThrough();

       consentUtils.checkConsent((resp) => {
           expect(consentUtils.handleError).toHaveBeenCalled();
           expect(resp).toEqual({});
           done();
       });
   });

    it('handles missing cmp no ping', () => {
        const consentConfig = {
            type: 'iab',
            timeout: 100,
            alwaysPing: false
        };

        const consentUtils = new ConsentHandler(consentConfig);

        spyOn(consentUtils, 'handleError').and.callThrough();

        const cb = jasmine.createSpy();

        consentUtils.checkConsent(cb);

        expect(consentUtils.handleError).toHaveBeenCalled();
        expect(cb).toHaveBeenCalledTimes(0);

    });
});

describe('ConsentHandler static', ()=>{
    it('with both consent and vendor', (done)=>{
        const consentConfig = {
            type: 'static',
            timeout: 100,
            consentData: {
                'getConsentData' : sampleConsentData,
                'getVendorConsents' : sampleVendorConsents
            }
        };

        const consentUtils = new ConsentHandler(consentConfig);
        consentUtils.checkConsent((resp)=> {
            expect(resp.getConsentData).toEqual(sampleConsentData);
            expect(resp.getVendorConsents).toEqual(sampleVendorConsents);
            done();
        });
    });

    it('missing consentData', (done)=>{
        const consentConfig = {
            type: 'static',
            timeout: 100,
            alwaysPing: true,
            consentData: {
                'getVendorConsents' : sampleVendorConsents
            }
        };

        const consentUtils = new ConsentHandler(consentConfig);
        consentUtils.checkConsent((resp) => {
           expect(resp).toEqual({});
           done();
        });

    });
});

describe('ConsentHandler iab iframe', ()=>{
    const eventListener = function(event) {
        const json = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        let resp;

        if (json.__cmpCall) {
            const request = json.__cmpCall;
            if (request.command === 'getConsentData') {
                resp = iframeConsentData;
            }
            else if (request.command === 'getVendorConsents') {
                resp = iframeVendorConsents;
            }

            if (resp) {
                const msg = {
                  __cmpReturn: {
                      callId: request.callId,
                      returnValue: resp,
                      success: true
                  }
                };
                window.postMessage(msg, event.origin);
            }
        }
    };

    beforeAll(()=>{
        window.addEventListener('message', eventListener);
    });

    afterAll(()=>{
        window.removeEventListener('message', eventListener);
    });

    it('call cmp', (done)=> {
        const consentConfig = {
            type: 'iab',
            timeout: 100
        };

        const consentUtils = new ConsentHandler(consentConfig);

        // Use a spy to override findCmpFrame instead of adding the iframe
        // directly to the window object.  The latter confuses other tests.
        spyOn(consentUtils, 'findCmpFrame').and.returnValue(window);

        consentUtils.checkConsent((resp) => {
            expect(resp.getConsentData).toEqual(iframeConsentData);
            expect(resp.getVendorConsents).toEqual(iframeVendorConsents);
            done();
        });

    });
});