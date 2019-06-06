/**
 * Set a cookie
 * @param {string} name Name of the cookie
 * @param {string} value Value of the cookie
 * @param {number} expires Expiration interval in minutes
 * @param {string} domain Domain of the cookie
 * @param {string} path Path of the cookie.
 * @param {string} sameSite Strict, Lax, or None
 */
export function setCookie(name, value, expires, domain = '', path = '/', sameSite) {
    if (name) {
        const expTime = new Date();
        expTime.setTime(expTime.getTime() + expires * 1000 * 60);
        window.document.cookie = name + '=' + encodeURIComponent(value) +
            ';path=' + path +
            ((domain) ? ';domain=' + domain : '') +
            ';expires=' + expTime.toUTCString() +
            ((sameSite) ? ';SameSite=' + sameSite : '');
    }
}

/**
 * Get the value of a cookie
 * @param {string} name Name of the cookie
 * @returns {string|null} Value of the cookie
 */
export function getCookie(name) {
    if (name && window.document.cookie) {
        const m = window.document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]*)\\s*(;|$)');
        return m ? decodeURIComponent(m[2]) : null;
    }
    return null;
}

/**
 * Delete a cookie
 * @param {string} name Name of the cookie
 */
export function delCookie(name) {
    setCookie(name, '', -1);
}

/**
 * Delete all cookies
 */
export function clearAllCookies() {
    document.cookie.split(';').forEach(s=>{
        const name = s.split('=')[0];
        if (name) {
            delCookie(name);
        }
    });
}

/**
 * Check if cookie is supported
 * @returns {boolean}
 */
export function isCookieSupported() {
    return (window.navigator.cookieEnabled || !!document.cookie.length);
}