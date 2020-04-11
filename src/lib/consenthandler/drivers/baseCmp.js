export class BaseCmp {
    constructor(api, returnMsgName, getMsgName, locatorFrame) {
        this.cmpApi = api;
        this.returnMsgName = returnMsgName;
        this.getMsgName = getMsgName;
        this.locatorFrame = locatorFrame;
    }
}