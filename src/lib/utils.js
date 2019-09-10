/**
 * Generate a random number that's less than radix
 * @param {number} radix  Max value of the return value
 * @returns {number} A random digit
 */
export function genRandomValue(radix = 16) {
    const cryptoObj = window.crypto || window.msCrypto; // for IE 11
    return (cryptoObj && cryptoObj.getRandomValues)
        ? crypto.getRandomValues(new Uint8Array(1))[0] % radix
        : Math.random() * radix;
}

/**
 * Generate a UUID.
 * @returns {any} A v4 UUID.
 */
export function uuid4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c=>{
        return (c ^ genRandomValue() >> c / 4).toString(16);
    });
}

/**
 * Parse a query string and return the result in a map
 * @param {object} qs A map of query string keys and values
 */
export function parseQueryString(qs) {
    const params = {};

    if (qs.charAt(0) === '?')
        qs = qs.substring(1);

    const gy = qs.split('&');
    for (let i=0; i<gy.length; i++) {
        const pair = gy[i].split('=');
        if (pair[0])
            params[pair[0]] = decodeURIComponent(pair[1] ? pair[1] : '');
    }
    return params;
}

/**
 * Append or replace query string parameter
 * @param {string} url URL to append query parameter to
 * @param {string} key Key of the parameter
 * @param {string} val Value of the parameter
 * @returns {string} Updated URL
 */
export function addQueryParam(url, key, val) {
    const parts = url.match(/([^?#]+)(\?[^#]*)?(#.*)?/);
    const path = parts[1] || '';
    const qstring = parts[2] || '';
    const hash = parts[3] || '';

    key = encodeURIComponent(key);
    val = encodeURIComponent(val || '');

    if (qstring) {
        const qsList = qstring.substr(1).split('&');
        let found = qsList.length; // end of array
        for (let i = 0; i < qsList.length; ++i) {
            const kv = qsList[i].split('=');
            if (kv[0] === key) {
                found = i;
                break;
            }
        }
        qsList[found] = key + '=' + val;
        return path + '?' + qsList.join('&') + hash;
    }
    else {
        return path + '?' + key + '=' + val + hash;
    }
}

/**
 * Fire a pixel
 * @param url Pixel URL
 */
export function firePixel(url) {
    const img = document.createElement('img');
    img.width = 1;
    img.height = 1;
    img.style.display = 'none';
    img.src = url;
}

/**
 * Copy overriding values from src to dst.  Skip src properties that have undefined values,
 * or didn't exist in dst.
 * @param dst Destination
 * @param src Source
 */
export function copyOptions(dst, src) {
    if (dst && src) {
        Object.keys(src).forEach((key) => {
            const val = src[key];
            if (typeof val !== 'undefined' && dst.hasOwnProperty(key)) {
                dst[key] = val;
            }
        });
    }
}