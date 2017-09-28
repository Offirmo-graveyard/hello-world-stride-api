

const prettyjson = require('prettyjson')
function prettify_json(data, options = {}) {
	return prettyjson.render(data, options)
}


// https://github.com/AnAppAMonth/linewrap
const linewrap = require('linewrap')
function wrap_string(s, size) {
	return linewrap(size, {skipScheme: 'ansi-color'})(s)
}


// https://github.com/sindresorhus/boxen
const boxen = require('boxen')
const enclose_in_box = boxen


export {
	prettify_json,
	wrap_string,
	enclose_in_box,
}
