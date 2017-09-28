import * as express from 'express'
import { ServerLogger, serverLoggerToConsole } from '@offirmo/loggers-types-and-stubs'

import { healthcheck } from './endpoints/healthcheck'
import { error } from './endpoints/error'
import { factory as demoFactory } from './endpoints/demo'
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
	router.use('/error', error)

	router.use('/demo', await demoFactory({
		logger,
		clientId: process.env.STRIDE_APP_DEMO_STRIDE_API_CLIENT_ID,
		clientSecret: process.env.STRIDE_APP_DEMO_STRIDE_API_CLIENT_SECRET,
	}))

	router.use('/chucknorris', await chuckNorrisFactory({
		logger,
	}))

	return router
}

export {
	InjectableDependencies,
	factory,
}
