/**
 * Locate the cmp frame to post message to
 * @returns {Window} cmp frame
 */
export function findCmpFrame(name) {
    let f = window;
    let cmpFrame;

    while(!cmpFrame) {
        try {
            if (f.frames[name])
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
 * Send one or more requests to the cmp and wait for all to complete before invoking
 * the callback.  The first parameter _requests_ is an array of arrays, where the latter
 * is command followed by parameter.  For example:
 *
 * [['getConsentData', null]['getVendorConsents']]
 *
 * If the requests all completed successfully, the callback is invoked with 2 parameters.
 * The first is an array of results, in the same order as the requests.  The second is a
 * boolean flag, indicating success or failure.
 *
 * If any of the requests failed, or if timeout occurred, then it's considered a failure.
 *
 * @param proxy instance to use to send requests
 * @param {array} requests List of commands and parameters
 * @param {function(*,boolean)} callback Callback to be invoked
 * @param {number} timeout Milliseconds to wait for all requests before the call is terminated
 */
export function sendCmpRequests(proxy, requests, callback, timeout=30000) {
    const promiseList = [];

    // A cmp proxy is required
    if (!proxy) {
        callback(Error('No CMP/TCF found'), false);
    }

    // Build a list of promises based on the requests
    requests.forEach((req)=>{
        promiseList.push(new Promise((resolve, reject) => {
            proxy(req[0], req[1], (result, success = true) => {
                if (success) {
                    resolve(result);
                }
                else
                    reject(Error('Consent request ' + req['command'] + " failed"));
            });
        }));
    });

    // Wait for all the promises to complete within time limit
    watchTimeout(Promise.all(promiseList), timeout).then((r)=>{
        callback(r, true);
    }).catch((e)=>{
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
function watchTimeout(promise, interval) {
    // setup a promise that fails after interval
    const watcher = new Promise((resolve, reject) => {
        const tout = setTimeout(()=>{
            clearTimeout(tout);
            reject(Error('Timeout ' + interval + ' ms'));
        }, interval);
    });

    // whichever completes first wins
    return Promise.race([promise, watcher]);
}
