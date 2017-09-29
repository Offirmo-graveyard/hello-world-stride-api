import * as express from 'express'
import { ServerLogger, serverLoggerToConsole } from '@offirmo/loggers-types-and-stubs'

import { healthcheck } from './endpoints/healthcheck'
import { error } from './endpoints/error'
import { factory as demoFactory } from './endpoints/demo'
import { factory as chuckNorrisFactory } from './endpoints/chucknorris'
import { factory as capFactory } from './endpoints/captainamerica'
import { factory as rpgFactory } from './endpoints/rpg'
import { factory as batFactory } from './endpoints/batman'

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

	router.use('/batman', await batFactory({
		logger,
		clientId: process.env.STRIDE_APP_BATMAN_STRIDE_API_CLIENT_ID,
		clientSecret: process.env.STRIDE_APP_BATMAN_STRIDE_API_CLIENT_SECRET,
	}))

	router.use('/captainamerica', await capFactory({
		logger,
		clientId:     process.env.STRIDE_APP_CAPTAIN_AMERICA_STRIDE_API_CLIENT_ID,
		clientSecret: process.env.STRIDE_APP_CAPTAIN_AMERICA_STRIDE_API_CLIENT_SECRET,
	}))

	router.use('/chucknorris', await chuckNorrisFactory({
		logger,
		clientId: process.env.STRIDE_APP_CHUCK_NORRIS_STRIDE_API_CLIENT_ID,
		clientSecret: process.env.STRIDE_APP_CHUCK_NORRIS_STRIDE_API_CLIENT_SECRET,
	}))

	/*
	router.use('/nickfury', await rpgFactory({
		logger,
		clientId: process.env.STRIDE_APP_NICK_FURY_STRIDE_API_CLIENT_ID,
		clientSecret: process.env.STRIDE_APP_NICK_FURY_STRIDE_API_CLIENT_SECRET,
	}))

	router.use('/wonderwoman', await rpgFactory({
		logger,
		clientId: process.env.STRIDE_APP_WONDER_WOMAN_STRIDE_API_CLIENT_ID,
		clientSecret: process.env.STRIDE_APP_WONDER_WOMAN_STRIDE_API_CLIENT_SECRET,
	}))
*/
	router.use('/rpg', await rpgFactory({
		logger,
		clientId: process.env.STRIDE_APP_RPG_STRIDE_API_CLIENT_ID,
		clientSecret: process.env.STRIDE_APP_RPG_STRIDE_API_CLIENT_SECRET,
	}))

	/*
	router.use('/', await rpgFactory({
		logger,
		clientId: process.env.STRIDE_APP__STRIDE_API_CLIENT_ID,
		clientSecret: process.env.STRIDE_APP__STRIDE_API_CLIENT_SECRET,
	}))
*/

	return router
}

export {
	InjectableDependencies,
	factory,
}
