import {BaseProxy} from "./baseProxy";

export const LOCAL_PROXY_NAME = 'localProxy';
export class LocalProxy extends BaseProxy{
    constructor(fCmp, driver) {
        super(driver);
        this.name = LOCAL_PROXY_NAME;
        this.fCmp = fCmp;
    }

    /**
     * wrapper function to call the drivers function to get the consent data
     * @param cmd
     * @param args
     * @param callback
     */
    callApi(cmd, args, callback) {
        this.driver.callCmp(this.fCmp, cmd, callback, args);
    }
}