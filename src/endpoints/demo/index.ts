import * as path from 'path'
import * as express from 'express'
import { ServerLogger, serverLoggerToConsole } from '@offirmo/loggers-types-and-stubs'

import { ExtendedRequest } from "../../types";
import { factory as stride_factory } from '../../lib/stride'
import { prettify_json } from '../../lib/misc'

interface InjectableDependencies {
	logger: ServerLogger
	env: string
	clientId: string
	clientSecret: string
}

const defaultDependencies: InjectableDependencies = {
	logger: serverLoggerToConsole,
	env: 'production',
} as InjectableDependencies

const APP_ID = 'stride-app-demo'

async function factory(dependencies: Partial<InjectableDependencies> = {}) {
	const { logger, env, clientId, clientSecret } = Object.assign({}, defaultDependencies, dependencies)
	logger.debug(`${APP_ID}: Initializing the Demo Stride bot…`)

	if (!clientId || !clientSecret)
		throw new Error(`${APP_ID}: missing stride API credentials!`)

	const stride = stride_factory({clientId, clientSecret, logger: logger as any as Console, env})
	const app = express()

	// https://expressjs.com/en/starter/static-files.html
	// REM: respond with index.html when a GET request is made to the homepage
	app.use(express.static(path.join(__dirname, 'public')))

	app.post('/installed', (req: ExtendedRequest, res, next) => {
		let logDetails: any = {
			endpoint: req.path,
			method: req.method,
		};

		(async function process() {
			const { cloudId, resourceId: conversationId, userId } = req.body
			logDetails = {
				...logDetails,
				cloudId,
				conversationId,
				userId,
			}

			logger.info(logDetails,'app installed in a conversation')
			console.log(prettify_json(req.body))

			res.sendStatus(204)
		})()
			.catch(next)
	})

	app.post('/uninstalled', (req: ExtendedRequest, res, next) => {
		let logDetails: any = {
			endpoint: req.path,
			method: req.method,
		};

		(async function process() {
			const { cloudId, resourceId: conversationId, userId } = req.body
			logDetails = {
				...logDetails,
				cloudId,
				conversationId,
				userId,
			}

			logger.info(logDetails,'app uninstalled from a conversation')
			console.log(prettify_json(req.body))

			res.sendStatus(204)
		})()
			.catch(next)
	})

	app.post('/bot-mentioned', (req: ExtendedRequest, res, next) => {
		let logDetails: any = {
			endpoint: req.path,
			method: req.method,
		};

		(async function process() {
			const { cloudId } = req.body
			const conversationId = req.body.conversation.id
			const senderId = req.body.message.sender.id

			logDetails = {
				...logDetails,
				cloudId,
				conversationId,
				senderId,
			}

			logger.info(logDetails,'bot mentioned in a conversation')
			console.log(prettify_json(req.body))

			await stride.sendTextMessage({cloudId, conversationId, message: '"hello"'})

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
