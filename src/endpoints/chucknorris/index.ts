import * as path from 'path'
import * as express from 'express'
import { ServerLogger, serverLoggerToConsole } from '@offirmo/loggers-types-and-stubs'

import { ExtendedRequest } from "../../types";

import { consolidatedTemplates } from '../../globals'


interface InjectableDependencies {
	logger: ServerLogger
}

const defaultDependencies: InjectableDependencies = {
	logger: serverLoggerToConsole,
}

async function factory(dependencies: Partial<InjectableDependencies> = {}) {
	const { logger } = Object.assign({}, defaultDependencies, dependencies)
	logger.debug('Initializing the Chuck Norris Stride bot…')

	const app = express()

	// https://expressjs.com/en/starter/static-files.html
	// REM: respond with index.html when a GET request is made to the homepage
	app.use(express.static(path.join(__dirname, 'public')))

	app.get('/installed', (req: ExtendedRequest, res, next) => {
		(async function render() {
			console.log('app installed in a conversation')
			res.sendStatus(204)
		})()
			.catch(next)
	})

	app.get('/uninstalled', (req: ExtendedRequest, res, next) => {
		(async function render() {
			console.log('app uninstalled from a conversation')
			res.sendStatus(204)
		})()
			.catch(next)
	})

		/*
	/bot-mention
	/uninstalled
*/
	return app
}

export {
	InjectableDependencies,
	factory,
}
