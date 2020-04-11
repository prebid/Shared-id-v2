import {BaseProxy} from "./baseProxy";

export class SafeFrameProxy extends BaseProxy{
    constructor(driver){
        super(driver);
    }
    /**
     * Calls cmp thru safe frame.
     * @param {string} commandName Name of the cmp request
     * @param arg
     * @param {function} callback Callback function
     */
    callSafeFrame(commandName, arg, callback) {
        function sf_callback(msgName, data) {

            if (msgName === this.driver.returnMsgName) {
                let response = data;
                if (this.driver.getSafeFrameData) {
                    response = this.driver.getSafeFrameData(data);
                }
                callback(response, data.success);
            }
        }

        window.$sf.ext.register(300, 250, sf_callback);
        window.$sf.ext[this.driver.safeframeCall](commandName);
    }
}