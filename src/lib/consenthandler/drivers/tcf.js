import {BaseCmp} from "./baseCmp";
import log from 'loglevel';

export const TCF_GET_DATA = "getTCData";
export const TCF_RETURN_MSG = "__tcfapiReturn";
export const TCF_GET_MSG = "__tcfapiCall";
export const TCF_FRAME = "__tcfapiLocator";
export const TCF_API = '__tcfapi';
export const TCF_API_VERSION = 2;

export class Tcf extends BaseCmp {
    constructor() {
        super(TCF_API, TCF_RETURN_MSG, TCF_GET_MSG, TCF_FRAME);
        this.cmpData = {};
        this.consentCallbackList = [];
    }

    /**
     * Normalize CMP v2 tcData into an object.
     * @param tcData A tcData from v2 requests.
     * @return {Object} Result with normalized fields.
     */

    formatData(tcData) {
        const ret = {version: 2};
        if (tcData) {
            ret.gdprApplies = tcData.gdprApplies;
            ret.consentString = tcData.tcString;
            ret.tcData = tcData;
            ret.hasStorageAccess = (ret.tcData && ret.tcData.purpose && ret.tcData.purpose.consents && ret.tcData.purpose.consents[1]);
        }
        log.debug('Caching TCF data', JSON.stringify(ret));

        return ret;
    }

    /**
     * create the json structure for post requests used by frameProxy
     * @param cmd
     * @param arg
     * @param callId
     * @returns {{"[TCF_GET_MSG]": {callId: *, parameter: *, version: *, command: *}}}
     */
    createMsg(cmd,arg,callId){
        return ({
            [TCF_GET_MSG]: {
                command: cmd,
                version: TCF_API_VERSION,
                parameter: arg,
                callId: callId
            }
        });
    }

    /**
     * direct api call used by LocalProxy
     * @param fCmp
     * @param cmd
     * @param callback
     * @param args
     */
    callCmp(fCmp, cmd, callback, args) {
        fCmp(cmd, TCF_API_VERSION, callback, args);
    }

    /**
     * on initialization we need to start a listener to receive the data when it's ready
     * @returns {[[string]]}
     */
    getListenerCmd(){ return [["addEventListener"]]; }

    /**
     * Parse the response received from the CMP server.  Might be called more than once per request so decide here when the full response is received
     * @param result the data received from the cmp server
     * @param success
     * @returns tcData object or undefined
     */
    parseMsg(result, success){
        log.debug('TCF parse message', success, JSON.stringify(result));
        const tcData = success ? result : undefined;
        this.cmpSuccess = success;
        this.cmpData = this.formatData(tcData); // return whatever came back from the cmp
        log.debug('Clearing TCF callback queue, queue size:', this.consentCallbackList.length);
        this.consentCallbackList.forEach((callback) => {
            callback(this.cmpData, success);
        });
        this.consentCallbackList.length = 0; //clear array in case of a future update
    }

    /**
     * Once we get the consent data back if there is anyone waiting for the data run their callbacks now
     * with the new data
     * @param result
     * @param success
     * @returns {number}
     */
    fetchDataCallback(result, success) {
        if(success) {
            if (result.gdprApplies === false || result.eventStatus === 'tcloaded' || result.eventStatus === 'useractioncomplete') {
                log.debug('TCF parse response', success, JSON.stringify(result));
                this.parseMsg(result, success);
            }
        }
        else {
            this.parseMsg(undefined, success);
        }
    }

    /**
     * Main function used by callers to get the consent data.  If the data is available return it now,
     * otherwise put the callback on a waiting list to be run later when we get the data
     * @param callback
     */
    getConsent(callback){
        if(this.cmpSuccess !== undefined){
            log.debug('Using cached TCF result', this.cmpSuccess, JSON.stringify(this.cmpData));
            callback(this.cmpData, this.cmpSuccess);
        }
        else{
            log.debug('No consent data yet, queuing TCF callback for later');
            this.consentCallbackList.push(callback);
        }
    }
}
