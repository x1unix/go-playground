/* config-overrides.js */
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = function override(config, env) {
    if (!config.plugins) {
        config.plugins = [];
    }
    config.plugins.push(
        new MonacoWebpackPlugin()
    );
    return config;
};