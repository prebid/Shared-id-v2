const {defineConfig} = require("eslint/config");
const globals = require("globals");

module.exports = defineConfig([{
    files: ['**/*.js'],
    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.mocha,
            ...globals.node
        },

        ecmaVersion: 2018,
        sourceType: "module",
        parserOptions: {},
    },

    "extends": [],
    "rules": {
        "no-console": "warn"
    },
}]);