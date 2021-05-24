import {setupPubcid} from './lib/pubcidModule';
import prefix from "loglevel-plugin-prefix";
import log from "loglevel";

(function(w, d, o) {
    // Initialize logger with prefix that looks like this
    // [Pubcid] DEBUG: message...

    prefix.reg(log);
    prefix.apply(log, {
        template: '[%n] %l -',
        nameFormatter: function(name) { return name || 'Pubcid'}
    });
    setupPubcid(w, d, o);
})(window, document, window.pubcid_options);
