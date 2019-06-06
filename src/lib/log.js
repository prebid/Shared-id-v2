class Log {
    constructor() {
        this.enabled = window.location.href.search(/[?&]?pubcid_debug=true[&$]?/) >= 0;
    }

    debug(...args) {
        if (this.enabled && typeof(console) != "undefined") {
            /* eslint-disable-next-line no-console */
            console.log(...args);
        }
    }

    errro(...args) {
        /* eslint-disable-next-line no-console */
        console.error(...args);
    }
}

export default new Log();