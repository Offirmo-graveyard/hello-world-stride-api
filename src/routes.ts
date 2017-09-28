import * as express from 'express'
import { ServerLogger, serverLoggerToConsole } from '@offirmo/loggers-types-and-stubs'

import { healthcheck } from './endpoints/healthcheck'
import { factory as chuckNorrisFactory } from './endpoints/chucknorris'

interface InjectableDependencies {
	logger: ServerLogger
}

const defaultDependencies: InjectableDependencies = {
	logger: serverLoggerToConsole,
}

async function factory(dependencies: Partial<InjectableDependencies> = {}) {
	const { logger } = Object.assign({}, defaultDependencies, dependencies)
	logger.debug('Hello from main route!')

	const router = express.Router()

	router.use('/healthcheck', healthcheck)

	router.use('/chucknorris', await chuckNorrisFactory({
		logger,
	}))

	return router
}

export {
	InjectableDependencies,
	factory,
}
