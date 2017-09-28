"use strict";
// unfortunately, we have some globals
// due to legacy libs or other constraints
// Factorize them here to better express the intent
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
exports.React = React;
// Client bundle expects React to be a global
global.React = React;
// node specific global side-effects on require
const consolidatedTemplates = require('consolidate'); // always needed
exports.consolidatedTemplates = consolidatedTemplates;
// now require all templating engines we wish to use
const dust = require('dustjs-linkedin'); // http://dejanglozic.com/2014/01/27/dust-js-such-templating/
exports.dust = dust;
require('dustjs-helpers'); // also
// config : remove whitespace suppression or it wrecks javascript
// https://github.com/linkedin/dustjs/wiki/Dust-Tutorial#controlling-whitespace-suppression
dust.optimizers.format = (ctx, node) => node;
const simplyconfig = require("simplyconfig");
// Load .env into process.env
simplyconfig.dotenv.load({ silent: true });
//# sourceMappingURL=globals.js.map