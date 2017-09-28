import { createServer } from 'http'
import * as bunyan from 'bunyan'
import { ServerLogger } from '@offirmo/loggers-types-and-stubs'
import { MongoClient } from 'mongodb'

import { factory as expressAppFactory } from './express-app'
import { ExtendedError } from "./types";


async function factory() {
	console.log('Starting_')

	// TODO plug to a syslog
	const logger: ServerLogger = bunyan.createLogger({
		name: 'ServerX',
		level: 'debug',
		serializers: bunyan.stdSerializers,
	})
	logger.info('Logger ready.')

	process.on('uncaughtException', (err: ExtendedError) => {
		console.error(`Uncaught exception!`, err)
		logger.error({err}, `Uncaught exception!`)
		// no crash while we are stateless
	})

	process.on('unhandledRejection', (reason: ExtendedError | any, p: Promise<any>) => {
		console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
		logger.error({ reason, p }, `Uncaught rejection!`)
		// no crash while we are stateless
	})

	process.on('warning', (warning: { name: string, message: string, stack: string}) => {
		console.warn(warning)
		logger.warn(warning)
	})

	logger.debug('Now listening to uncaughts and warnings.')


	const config = {
		port: process.env.PORT || 3333,
		isHttps: (process.env.IS_HTTPS === 'true'),
	}

	const server = createServer(await expressAppFactory({
		logger,
		isHttps: config.isHttps,
	}))

	server.listen(config.port, (err: Error) => {
		if (err) {
			console.error(`Server error!`, err)
			logger.fatal(err, `Server error!`)
			return
		}

		logger.info(`Server launched, listening on :${config.port}`)
	})

}

factory()
.catch(e => {
	console.error('Server failed to launch:', e.message)
})
