
function error(req, res, next) {
	throw new Error('Testing error handling...')
}

export {
	error,
}
