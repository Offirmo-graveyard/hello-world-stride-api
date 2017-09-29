import * as path from 'path'
import * as express from 'express'
import * as request from 'request'
import { ServerLogger, serverLoggerToConsole } from '@offirmo/loggers-types-and-stubs'
import { Random, Engine } from '@offirmo/random'

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

const APP_ID = 'stride-app-chucknorris'

async function factory(dependencies: Partial<InjectableDependencies> = {}) {
	const { logger, env, clientId, clientSecret } = Object.assign({}, defaultDependencies, dependencies)
	logger.debug(`${APP_ID}: Initializing the bot…`)
	const rng: Engine = Random.engines.mt19937().autoSeed()

	if (!clientId || !clientSecret) {
		console.log(prettify_json(process.env))
		throw new Error(`${APP_ID}: missing stride API credentials!`)
	}

	const stride = stride_factory({
		clientId,
		clientSecret,
		logger: logger as any as Console,
		env,
		debugId: `${APP_ID} stride.js`
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

	function getRandomAssistanceMsg({user}) {
		const mention ={
				type: "mention",
				attrs: {
					id: user.id,
					text: user.nickName || user.displayName,
				}
			}

		const content = Random.pick(rng, [
			[
				{ type: "text", text: `You'd better not mess with `},
				mention,
				{ type: "text", text: `...`},
			],
			[
				mention,
				{ type: "text", text: ` is a friend of mine. Just saying.`},
			],
			[
				{ type: "text", text: `I've taught a bit of martial arts to `},
				mention,
				{ type: "text", text: ` . Just saying.`},
			],
		])

		return {
			version: 1,
			type: "doc",
			content: [
				{
					type: "paragraph",
					content,
				}
			]
		}
	}

	function getRandomAdviceMsg() {
		return Random.pick(rng, [
			`Just round-kick them all!`
		])
	}


	const app = express()

	// https://expressjs.com/en/starter/static-files.html
	// REM: respond with index.html when a GET request is made to the homepage
	app.use(express.static(path.join(__dirname, 'public')))

	app.use(stride.validateJWT)

	app.post('/on-app-installed', (req: ExtendedRequest, res, next) => {
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

			stride.getConversation({cloudId, conversationId})
				.then(conversation => {
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

	app.post('/on-app-uninstalled', (req: ExtendedRequest, res, next) => {
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

	app.post('/on-bot-mentioned', (req: ExtendedRequest, res, next) => {
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

			stride.getUser({cloudId, userId: senderId}).then(user => {
				console.log('getUser():\n', prettify_json(user))
				const documentMessage = {
					version: 1,
					type: "doc",
					content: [
						{
							type: "paragraph",
							content: [,
								{
									type: "mention",
									attrs: {
										id: user.id,
										text: user.nickName || user.displayName
									}
								},
								{
									type: "text",
									text: ` I've my eye on you...`,
								},
							]
						}
					]
				}

				return stride.sendDocumentMessage({
					cloudId,
					conversationId,
					documentMessage,
					//documentMessage : stride.convertTextToDoc(`stride.getUser(): I'll remember that you said "${text}", "${user.displayName}"!`)
				})
			})

			res.sendStatus(204)
		})()
			.catch(next)
	})

	app.post('/on-bot-directly-messaged', (req: ExtendedRequest, res, next) => {
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

	app.post('/on-any-message', (req: ExtendedRequest, res, next) => {
		let logDetails: any = {
			APP_ID,
			endpoint: req.path,
			method: req.method,
		};

		(async function process() {
			const { cloudId, message: {text} } = req.body
			const conversationId = req.body.conversation.id
			const senderId = req.body.message.sender.id

			logDetails = {
				...logDetails,
				cloudId,
				conversationId,
				senderId,
			}

			logger.info(logDetails,'bot saw any message in a conversation')

			if (text && text.includes('roundkick') || text.includes('round kick')) {
				stride.sendTextMessageDirectedToUser({
					cloudId,
					conversationId,
					userId: senderId,
					text: `do you want me to teach you?`
				})
			}

			res.sendStatus(204)
		})()
			.catch(next)
	})

	app.post('/on-custom-request', (req: ExtendedRequest, res, next) => {
		let logDetails: any = {
			APP_ID,
			endpoint: req.path,
			method: req.method,
		};

		(async function process() {
			const {cloudId, conversationId} = (req as any).strideContext
			const {requestId, senderId} = req.body

			logger.info(logDetails,'bot received a custom request')

			const user = await stride.getUser({cloudId, userId: senderId})
			switch (Number(requestId)) {
				case 1: {
					stride.sendDocumentMessage({
							cloudId,
							conversationId,
							documentMessage: getRandomAssistanceMsg({user}),
						})
					break
				}
				case 2: {
					stride.sendTextMessage({cloudId, conversationId, text: `My advice: ` + getRandomAdviceMsg()})
					break
				}
				case 3: {
					r2({method: 'GET', uri: 'https://api.chucknorris.io/jokes/random'})
						.then(JSON.parse)
						.then(({value}) => stride.sendTextMessage({cloudId, conversationId, text: 'Fact: ' + value}))
					break
				}
				default:
					stride.sendTextMessageDirectedToUser({
						cloudId,
						conversationId,
						userId: senderId,
						text: `I m not yet understanding request "${requestId}"...`
					})
					break
			}

			res.sendStatus(204)
		})()
			.catch(next)
	})

	app.get('/glance-state', /*cors(),*/function (req, res) {
		res.send(
			JSON.stringify({
				"label": {
					"value": "Chuck Norris"
				}
			}));
	});

	return app
}

export {
	InjectableDependencies,
	factory,
}
