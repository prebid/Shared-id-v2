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
        const removeCmd = this.driver.getRmListenerCmd();
        if (cmd) {
            this.sendCmpRequests(cmd, (result, success) => {
                const listenerId = this.driver.fetchDataCallback(result, success);
                if (listenerId && removeCmd) {
                    this.sendCmpRequests(removeCmd, () => {}, listenerId);
                }
            }, timeout);
        }
    }

    /**
     * wrapper function to call the drivers get function
     * @param callback
     * @param timeout
     */
    getConsent(callback, timeout) {
        this.driver.getConsent(callback, timeout);
    }

    /**
     * call the api to get the consent data.  Since it can take multiple api requests to get all the data needed
     * create a promise for each command so it can be done it parallel.
     * @param requests
     * @param callback
     * @param timeout
     */
    sendCmpRequests(requests, callback, timeout = 30000) {
        const promiseList = [];
        // A cmp driver is required
        if (!this.driver) {
            callback(Error('No CMP/TCF found'), false);
        }

        // Build a list of promises based on the requests
        requests.forEach((req) => {
            promiseList.push(new Promise((resolve, reject) => {
                this.callApi(req[0], req[1], (result, success = true) => {
                    if (success) {
                        resolve(result);
                    }
                    else {
                        reject(Error('Consent request ' + req + " failed"));
                    }
                });
            }));
        });

        // Wait for all the promises to complete within time limit
        this.watchTimeout(Promise.all(promiseList), timeout).then((r) => {
            callback(r, true);
        }).catch((e) => {
            callback(e, false);
        });
    }

    /**
     * Set up a timeout for a promise.  If the promise completes first, then
     * timeout is ignored.  Otherwise if timeout occurred first, then
     * the promise is ignored.
     *
     * @param promise
     * @param interval Timeout in ms
     * @return {Promise<*>}
     */
    watchTimeout(promise, interval) {
        // setup a promise that fails after interval
        const watcher = new Promise((resolve, reject) => {
            const tout = setTimeout(() => {
                clearTimeout(tout);
                reject(Error('Timeout ' + interval + ' ms'));
            }, interval);
        });

        // whichever completes first wins
        return Promise.race([promise, watcher]);
    }
}

