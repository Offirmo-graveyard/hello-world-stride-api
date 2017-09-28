import * as http from 'http'
import * as express from 'express'
import * as uuid from 'uuid'
import * as bodyParser from 'body-parser'
import * as morgan from 'morgan'
import * as helmet from 'helmet'
import { ServerLogger, serverLoggerToConsole } from '@offirmo/loggers-types-and-stubs'

import { factory as routesFactory } from './routes'
import { ExtendedError, RequestWithUUID, ExtendedRequest } from "./types"


interface InjectableDependencies {
	logger: ServerLogger
	isHttps: boolean
}

const defaultDependencies: InjectableDependencies = {
	logger: serverLoggerToConsole,
	isHttps: false,
}

async function factory(dependencies: Partial<InjectableDependencies> = {}) {
	const { logger, isHttps } = Object.assign({}, defaultDependencies, dependencies)
	logger.debug('Initializing the top express app…')

	if (!isHttps)
		logger.warn('XXX please activate HTTPS on this server !')

	const app = express()

	// https://expressjs.com/en/4x/api.html#app.settings.table
	app.enable('trust proxy')
	app.disable('x-powered-by')

	app.use(function assignId(req: RequestWithUUID, res, next) {
		req.uuid = uuid.v4()
		next()
	})

	// log the request as early as possible
	app.use((req: RequestWithUUID, res, next) => {
		logger.info({
			uuid: req.uuid,
			method: (morgan as any)['method'](req),
			url: (morgan as any)['url'](req),
		})
		next()
	})

	// TODO activate CORS
	app.use(helmet())


	app.use(bodyParser.urlencoded({
		extended: false,
		parameterLimit: 100, // less than the default
		limit: '1Mb', // for profile image
	}))
	app.use(bodyParser.json())

	app.use(await routesFactory({
		logger,
	}))

	app.use((req, res) => {
		logger.error(`! 404 on "${req.path}" !"`)
		res.status(404).end()
	})

	const errorHandler: express.ErrorRequestHandler = (err: ExtendedError, req, res, next) => {
		if (!err) err = new Error('unknown error')
		logger.error({err}, 'app error handler: request failed!');
		const status = err.httpStatusHint || 500;
		res.status(status).send(`Something broke! Our devs are already on it! [${status}: ${http.STATUS_CODES[status]}]`);
	}
	app.use(errorHandler)

	return app
}

export {
	InjectableDependencies,
	factory,
}
