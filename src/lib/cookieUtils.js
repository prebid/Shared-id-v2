/**
 * Set a cookie
 * @param {string} name Name of the cookie
 * @param {string} value Value of the cookie
 * @param {number} [expires] Expiration interval in minutes
 * @param {string} [domain] Domain of the cookie
 * @param {string} [path] Path of the cookie.
 * @param {string} [sameSite] Strict, Lax, or None
 */
export function setCookie(name, value, expires, domain = '', path = '/', sameSite) {
   if (name) {
        let expTime;
        if (expires) {
            expTime = new Date();
            expTime.setTime(expTime.getTime() + expires * 1000 * 60);
        }

        window.document.cookie = name + '=' + encodeURIComponent(value) +
            ';path=' + path +
            ((domain) ? ';domain=' + domain : '') +
            ((expTime) ? ';expires=' + expTime.toUTCString() : '') +
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
 * Delete a cookie.  Name, domain, and path all have to match in order to delete a cookie correctly.
 * SameSite is optional.  Firefox complains if sameSite is omitted or None when the connection isn't secure.
 * @param {string} name Name of the cookie
 * @param {string} [domain] Domain of the cookie
 * @param {string} [path] Path of the cookie.
 * @param {string} [sameSite] Strict, Lax, or None
 */
export function delCookie(name, domain, path, sameSite) {
    setCookie(name, '', -1, domain, path, sameSite);
}

/**
 * Delete all cookies.  This is a testing aid and shouldn't be used in production.
 * @param {string} [domain] Domain of the cookie*
 * @param {string} [path] Path of the cookie.
 */
export function clearAllCookies(domain, path) {
    document.cookie.split(';').forEach(s=>{
        const name = s.split('=')[0];
        if (name) {
            delCookie(name.trim(), domain, path);
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
