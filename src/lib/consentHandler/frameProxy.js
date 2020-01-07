/**
 * Helper for communicating with cmp thru messages
 */
export class FrameProxy {
    constructor(frame, driver) {
        this.cmpCallbacks = {};
        this.cmpFrame = frame;
        this.driver = driver;

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
        if (json[this.driver.returnMsgName] && json[this.driver.returnMsgName].callId) {
            let r = json[this.driver.returnMsgName];

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
        let msg = this.driver.createMsg(cmd,arg,callId);

        // Update callback table and post the message
        this.cmpCallbacks[callId] = callback;
        this.cmpFrame.postMessage(msg, '*');
    }
}