export const GET_CONSENT_DATA = "getConsentData";
export const GET_VENDOR_CONSENTS = "getVendorConsents";

/**
 * Helper for communicating with cmp thru messages
 */
class CmpProxy {
    constructor(frame) {
        this.cmpCallbacks = {};
        this.cmpFrame = frame;

        // Save the lambda so it can be used in both add and remove
        this.fProcess = (event) => this.processEvent(event);

        // Set up event listener
        this.setup();
    }

    /**
     * Event listener to capture cmp responses.
     * @param {Object} event An event that might contain cmp response
     */
    processEvent(event) {
        const json = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        // Check if this is a reply from cmp
        if (json.__cmpReturn && json.__cmpReturn.callId) {
            let r = json.__cmpReturn;

            // Check if this is a response meant for us
            let callback = this.cmpCallbacks[r.callId];

            // If so, then invoke callback and remove it from the table
            if (typeof callback !== 'undefined') {
                callback(r.returnValue, r.success);
                delete this.cmpCallbacks[r.callId];
            }
        }
    }

    /**
     * Add event listener
     */
    setup() {
        if (window.addEventListener)
            window.addEventListener('message', this.fProcess, false);
        else
            window.attachEvent('onmessage', this.fProcess);
    }

    /**
     * Remove event listener
     */
    stop() {
        if (window.removeEventListener)
            window.removeEventListener('message', this.fProcess, false);
        else
            window.detachEvent('onmessage', this.fProcess());
    }

    /**
     * Make a cmp call.
     * @param {string} cmd One of the cmp commands like getConsentData or getVendorConsents
     * @param {*} arg Optional argument for the cmp command
     * @param {function} callback Function to callback
     */
    call(cmd, arg, callback) {
        // Generate a random id that helps to identify responses
        let callId = Math.random() + "";

        // Format a cmp message
        let msg = {
            __cmpCall: {
                command: cmd,
                parameter: arg,
                callId: callId
            }
        };

        // Update callback table and post the message
        this.cmpCallbacks[callId] = callback;
        this.cmpFrame.postMessage(msg, '*');
    }
}

/**
 * Helper to determine GDPR consents.
 *
 * If consentConfig.type is 'iab', then it will attempt to call cmp in the following order:
 *  1. Cmp in the same frame, or top frame.
 *  2. If safe frame is used, then call cmp thru safe frame.
 *  3. Look for a cmp frame and call cmp thru messages.
 *
 * If consentConfig.type is 'static', then the consent data is expected to be supplied in
 * consent.consentData.  Usually this means the caller has managed to call cmp on its own.
 */
export default class ConsentHandler {
    constructor(options = {}) {
        this.config = {
            type: '',
            timeout: 500,
            consentData: {},
            alwaysPing: true
        };

        Object.assign(this.config, options);

        this.hasCompleted = false;
        this.callback = null;
        this.data = {};
        this.timer = null;
        this.cmpProxy = null;

        this.commands = {
            iab: ()=>this.fetchConsentData(),
            static: ()=>this.fetchStaticData()
        }
    }

    /**
     * Handles callback from cmp to process getConsentData requests
     * @param {Object} response getConsentData data
     * @param {boolean} success Whether the cmp call succeeded.  Default is true.
     */
    consentCallback(response, success) {
        success = success || true;
        if (success) {
            this.data[GET_CONSENT_DATA] = response;
            if (this.data[GET_VENDOR_CONSENTS]) this.handleSuccess();
        }
        else {
            this.handleError();
        }
    }

    /**
     * Handles callback from cmp to process getVendeorConsents requests
     * @param {Object} response getVendorConsents data
     * @param {boolean} success Whether the cmp call succeeded.  Default is true.
     */
    vendorCallback(response, success) {
        success = success || true;
        if (success) {
            this.data[GET_VENDOR_CONSENTS] = response;
            if (this.data[GET_CONSENT_DATA]) this.handleSuccess();
        }
        else {
            this.handleError();
        }
    }


    /**
     * Calls cmp thru safe frame.
     * @param {string} commandName Name of the cmp request
     * @param {function} callback Callback function
     */
    callSafeFrameCmp(commandName, callback) {
        function sf_callback(msgName, data) {
            if (msgName === 'cmpReturn') {
                const response = (data.cmpCommand === GET_CONSENT_DATA) ?
                    data.vendorConsentData : data.vendorConsents;
                callback(response, data.success);
            }
        }

        window.$sf.ext.register(300, 250, sf_callback);
        window.$sf.ext.cmp(commandName);
    }

    /**
     * Locate the cmp frame to post message to
     * @returns {Window} cmp frame
     */
    findCmpFrame() {
        let f = window;
        let cmpFrame;

        while(!cmpFrame) {
            try {
                if (f.frames["__cmpLocator"])
                    cmpFrame = f;
            }
            catch(e) {
                // noop
            }

            if (f === window.top) break;
            f = f.parent;
        }

        return cmpFrame;
    }

    /**
     * Find and call cmp when type is 'iab'
     */
    fetchConsentData() {
        let fCmp;

        fCmp = window.__cmp;
        if (!fCmp && window.top)
            fCmp = window.top.__cmp;

        if (typeof fCmp === 'function') {
            fCmp(GET_CONSENT_DATA, null, (resp) => this.consentCallback(resp));
            fCmp(GET_VENDOR_CONSENTS, null, (resp) => this.vendorCallback(resp));
        }
        else if (window.$sf && window.$sf.ext) {
            this.callSafeFrameCmp(GET_CONSENT_DATA, (resp) => this.consentCallback(resp.vendorConsentData));
            this.callSafeFrameCmp(GET_VENDOR_CONSENTS, (resp) => this.vendorCallback(resp.vendorConsents));
        }
        else {
            const frame = this.findCmpFrame();
            if (frame) {
                const cmpProxy = new CmpProxy(frame);
                this.cmpProxy = cmpProxy;
                cmpProxy.call(GET_CONSENT_DATA, null, (resp) => this.consentCallback(resp));
                cmpProxy.call(GET_VENDOR_CONSENTS, null, (resp) => this.vendorCallback(resp));
            }
            else {
                this.handleError();
            }
        }
    }

    /**
     * Obtain consent data from consentConfig.
     */
    fetchStaticData() {
        if (this.config.consentData && this.config.consentData[GET_CONSENT_DATA]) {
            this.data = this.config.consentData;
            this.handleSuccess();
        }
        else {
            this.handleError();
        }
    }

    /**
     * Called when cmp calls fail.  Reset result to empty object.
     */
    handleError() {
        // console.log('cmp failed here');
        this.data = {};
        this.triggerCallback(false);
    }

    /**
     * Called when cmp calls succeeded.
     */
    handleSuccess() {
        this.triggerCallback();
    }

    /**
     * Final step in cmp processing.  Clean up and invoke callback if needed.
     * @param {boolean} success Indicate when a failure has occurred
     */
    triggerCallback (success=true) {
        if (!this.hasCompleted) {
            this.hasCompleted = true;

            if (this.timer)
                clearTimeout(this.timer);

            if (this.cmpProxy)
                this.cmpProxy.stop();

            if (success || this.config.alwaysPing)
                this.callback(this.data);
        }
    }

    /**
     * Entry point to determine consent.
     * @param {function} callback Function to call after consent has been determined
     */
    checkConsent(callback) {
        this.callback = callback;

        //this.fetchConsentData();
        const command = this.commands[this.config.type];

        if (command) {
            command();

            if (!this.hasCompleted) {
                const {timeout = 0} = this.config;

                if (timeout > 0) {
                    this.timer = setTimeout(() => this.handleError(), timeout);
                } else {
                    this.handleError();
                }
            }
        }
        else {
            this.handleError();
        }
    }
}