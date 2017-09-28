"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prettyjson = require('prettyjson');
function prettify_json(data, options = {}) {
    return prettyjson.render(data, options);
}
exports.prettify_json = prettify_json;
// https://github.com/AnAppAMonth/linewrap
const linewrap = require('linewrap');
function wrap_string(s, size) {
    return linewrap(size, { skipScheme: 'ansi-color' })(s);
}
exports.wrap_string = wrap_string;
// https://github.com/sindresorhus/boxen
const boxen = require('boxen');
const enclose_in_box = boxen;
exports.enclose_in_box = enclose_in_box;
//# sourceMappingURL=misc.js.map