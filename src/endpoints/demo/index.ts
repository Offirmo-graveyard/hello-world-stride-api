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

	const app = express()

	// https://expressjs.com/en/starter/static-files.html
	// REM: respond with index.html when a GET request is made to the homepage
	app.use(express.static(path.join(__dirname, 'public')))

	app.post('/installed', (req: ExtendedRequest, res, next) => {
		let logDetails: any = {
			endpoint: req.path,
			method: req.method,
			APP_ID,
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
			console.log(prettify_json(req.body))

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
			console.log('------\nfull body\n', prettify_json(req.body))
			console.log('------\ndocument\n', prettify_json(document))

			stride.sendTextMessage({cloudId, conversationId, text: '"stride.sendTextMessage()"'})
			stride.sendDocumentMessage({
				cloudId,
				conversationId,
				documentMessage: stride.convertTextToDoc('"stride.sendDocumentMessage()"')
			})
			stride.sendUserMessage({
				cloudId,
				userId: senderId,
				documentMessage: stride.convertTextToDoc('"stride.sendDocumentMessage()"')
			})
			stride.getConversation({cloudId, conversationId}).then(conversation => {
				console.log('getConversation():\n', prettify_json(conversation))
				return stride.sendTextMessage({cloudId, conversationId, text: `stride.getConversation(): nice room "${conversation.name}"!`})
			})
			stride.getUser({cloudId, userId: senderId}).then(user => {
				console.log('getUser():\n', prettify_json(user))
				const documentMessage = {
					version: 1,
					type: "doc",
					content: [
						{
							type: "paragraph",
							content: [
								{
									type: "text",
									text: `stride.getUser(): I'll remember that you said "${text}", "${user.displayName}"!`,
								},
								{
									type: "mention",
									attrs: {
										id: user.id,
										text: user.nickName
									}
								}
							]
						}
					]
				}

				return stride.sendDocumentMessage({
					cloudId,
					conversationId,
					documentMessage /*: stride.convertTextToDoc(`stride.getUser(): I'll remember that you said "${text}", "${user.displayName}"!`) */
				})
			})
			stride.convertDocToText(document).then(msg => {
				return stride.sendTextMessage({cloudId, conversationId, text: `stride.convertDocToText(): was your message "${msg}"?`})
			})
			/*
			stride.createConversation({
				cloudId,
				name: 'TEST SHPXL-392 conversation',
				privacy: 'public',
				topic: 'TEST topic',
			})
				.then(() => {
					stride.sendTextMessage({cloudId, conversationId, message: `created a conversation`})
				})
				.catch(() => {
					stride.sendTextMessage({cloudId, conversationId, message: `failed to create a conversation`})
				})*/

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
