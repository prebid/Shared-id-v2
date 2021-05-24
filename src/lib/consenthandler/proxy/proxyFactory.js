import {Tcf} from "../drivers/tcf";
import {LocalProxy} from "./localProxy";
import {SafeFrameProxy} from "./safeFrameProxy";
import {FrameProxy} from "./frameProxy";
import log from 'loglevel';

/**
 * Create the driver to use for the site.
 * @returns {*}
 */
export function createProxy() {
    let proxy;
    proxy = _createProxy(new Tcf());
    return proxy;
}

/**
 * Locate the cmp frame to post message to
 * @returns {Window} cmp frame
 */
export function findCmpFrame(name) {
    let f = window;
    let cmpFrame;

    while (!cmpFrame) {
        try {
            if (f.frames[name])
                cmpFrame = f;
        } catch (e) {
            // noop
        }

        if (f === window.top) break;
        f = f.parent;
    }

    return cmpFrame;
}

/**
 * figure out which proxy to create to get the consent data.
 * Local proxy takes priority over safe frame
 * safeframe proxy takes priority over frame proxy
 * @param driver
 * @returns {LocalProxy|FrameProxy|SafeFrameProxy}
 * @private
 */
function _createProxy(driver) {
    let fCmp;
    try {
        fCmp = window[driver.cmpApi] || window.top[driver.cmpApi];
    } catch (e) {
        //noop
    }

    let proxy;
    if (typeof fCmp === 'function') {
        log.debug('Using local proxy');
        proxy = new LocalProxy(fCmp, driver);
    } else if (window.$sf && window.$sf.ext && window.$sf.ext[driver.safeframeCall]) {
        log.debug('Using safe frame proxy');
        proxy = new SafeFrameProxy(driver);
    } else {
        log.debug('Using frame proxy');
        const frame = findCmpFrame(driver.locatorFrame);
        if (frame) {
            proxy = new FrameProxy(frame, driver);
        }
    }
    return proxy;
}
