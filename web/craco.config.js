const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const CracoAlias = require("craco-alias");

module.exports = {
  webpack: {
    configure: cfg => {
      cfg.resolve.extensions.push('.wasm');
      return cfg;
    },
    plugins: {
      add: [
        new MonacoWebpackPlugin(),
        new CircularDependencyPlugin({
          // exclude detection of files based on a RegExp
          exclude: /a\.js|node_modules/,
          // include specific files based on a RegExp
          include: /src/,
          // add errors to webpack instead of warnings
          failOnError: true,
          // allow import cycles that include an asyncronous import,
          // e.g. via import(/* webpackMode: "weak" */ './file.js')
          allowAsyncCycles: false,
          // set the current working directory for displaying module paths
          cwd: process.cwd(),
        }),
      ]
    }
  },
  plugins: [
    {
       plugin: CracoAlias,
       options: {
          source: "tsconfig",
          // baseUrl SHOULD be specified
          // plugin does not take it from tsconfig
          baseUrl: "./src",
          /* tsConfigPath should point to the file where "baseUrl" and "paths"
          are specified*/
          tsConfigPath: "./tsconfig.paths.json"
       }
    }
 ]
};
