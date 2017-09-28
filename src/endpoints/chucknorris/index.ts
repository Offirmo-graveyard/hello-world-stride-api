import * as path from 'path'
import * as express from 'express'
import { ServerLogger, serverLoggerToConsole } from '@offirmo/loggers-types-and-stubs'
const request = require('request')


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

const APP_ID = 'stride-app-chuck-norris'

async function factory(dependencies: Partial<InjectableDependencies> = {}) {
	const { logger, env, clientId, clientSecret } = Object.assign({}, defaultDependencies, dependencies)
	logger.debug(`${APP_ID}: Initializing the bot…`)

	if (!clientId || !clientSecret) {
		console.log(prettify_json(process.env))
		throw new Error(`${APP_ID}: missing stride API credentials!`)
	}

	const stride = stride_factory({
		clientId,
		clientSecret,
		logger: logger as any as Console,
		env,
		debugId: `${APP_ID}stride.js`
	})
	// preload the token (async)
	stride.getAccessToken()


	function r2(options) {
		let logDetails = {
			...options
		}
		return new Promise((resolve, reject) => {
			logger.info({...logDetails}, `${APP_ID}: requesting...`)

			request(options, (err, response, body) => {
				if (err) {
					logger.error({...logDetails, err}, `${APP_ID}: request failed!`)
					return reject(err)
				}

				if (!response || response.statusCode >= 399) {
					logger.error({...logDetails, ...response, err}, `${APP_ID}: request failed with an error response!`)
					return reject(new Error('Request failed'))
				}

				resolve(body)
			})
		})
	}

	const app = express()

	// https://expressjs.com/en/starter/static-files.html
	// REM: respond with index.html when a GET request is made to the homepage
	app.use(express.static(path.join(__dirname, 'public')))

	app.post('/installed', (req: ExtendedRequest, res, next) => {
		let logDetails: any = {
			APP_ID,
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

			stride.getConversation({cloudId, conversationId}).then(conversation => {
				stride.sendTextMessage({
					cloudId,
					conversationId,
					text: `Nobody moves! Chuck Norris is in ${conversation.name}!`
				})

				setTimeout(() => {
					stride.sendTextMessage({
						cloudId,
						conversationId,
						text: `One wrong move and you'll get round-kicked!`
					})
				}, 5000)
			})

			res.sendStatus(204)
		})()
			.catch(next)
	})

	app.post('/uninstalled', (req: ExtendedRequest, res, next) => {
		let logDetails: any = {
			APP_ID,
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

			stride.sendTextMessage({
				cloudId,
				conversationId,
				text: `I'm leaving for now. Stay quiet!`
			})

			res.sendStatus(204)
		})()
			.catch(next)
	})

	app.post('/bot-mentioned', (req: ExtendedRequest, res, next) => {
		let logDetails: any = {
			APP_ID,
			endpoint: req.path,
			method: req.method,
		};

		(async function process() {
			const { cloudId, message: {text, body: document} } = req.body
			const conversationId = req.body.conversation.id
			const senderId = req.body.message.sender.id

			logDetails = {
				...logDetails,
				cloudId,
				conversationId,
				senderId,
			}

			logger.info(logDetails,'bot mentioned in a conversation')

			const options = {
				uri: 'https://api.chucknorris.io/jokes/random',
				method: 'GET',
			}
			r2(options)
				.then(JSON.parse)
				.then(response => {
					console.log('CN facts response\n', prettify_json(response))
					return stride.sendTextMessage({cloudId, conversationId, text: response.value})
				})

			res.sendStatus(204)
		})()
			.catch(next)
	})

	app.post('/bot-directly-messaged', (req: ExtendedRequest, res, next) => {
		let logDetails: any = {
			APP_ID,
			endpoint: req.path,
			method: req.method,
		};

		(async function process() {
			const { cloudId, message: {text, body: document} } = req.body
			const conversationId = req.body.conversation.id
			const senderId = req.body.message.sender.id

			logDetails = {
				...logDetails,
				cloudId,
				conversationId,
				senderId,
			}

			logger.info(logDetails,'bot directly messaged')
			//console.log('------\nfull body\n', prettify_json(req.body))

			stride.getUser({cloudId, userId: senderId}).then(user => {
				return stride.sendUserMessage({
					cloudId,
					userId: senderId,
					documentMessage: stride.convertTextToDoc(`Ah ah, I knew that you wanted to be my disciple, ${user.displayName}!`)
				})
			})

			res.sendStatus(204)
		})()
			.catch(next)
	})

	return app
}

export {
	InjectableDependencies,
	factory,
}
