import log from 'loglevel';

export class BaseProxy {
    constructor(driver) {
        this.driver = driver;
    }

    /**
     * send the request to get the consent data
     * @param timeout
     */
    fetchConsentData(timeout) {
        const cmd = this.driver.getListenerCmd();
        if (cmd) {
            this.sendCmpRequests(cmd, (result, success) =>{
                log.debug('Received CMP server response', success, JSON.stringify(result));
                this.driver.fetchDataCallback(result, success);
            }, timeout);
        }
    }

    /**
     * wrapper function to call the drivers get function
     * @param callback
     */
    getConsent(callback) {
        this.driver.getConsent(callback);
    }

    /**
     * call the api to get the consent data.  Since it can take multiple api requests to get all the data needed
     * create a promise for each command so it can be done it parallel.
     * @param requests array of all the requests to make
     * @param callback called with an array of all the request responses
     * @param timeout timeout value for all the requests to finish
     */
    sendCmpRequests(requests, callback, timeout = 30000) {
        // A cmp driver is required
        if (!this.driver) {
            callback(Error('No CMP/TCF found'), false);
        }

        requests.forEach((req) => {
            this.callApi(req[0], req[1], callback);
        });

        setTimeout(()=>{
            if (this.driver.cmpSuccess === undefined){
                log.debug('Timedout waiting for CMP server');
                this.driver.fetchDataCallback(undefined, false);
            }
        }, timeout);
    }
}

