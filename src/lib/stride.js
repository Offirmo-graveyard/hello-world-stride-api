// see the stride API
// https://developer.stg.internal.atlassian.com/cloud/stride/rest/

const request = require('request')
const jwtUtil = require('jwt-simple')


function factory({clientId, clientSecret, logger = console, env = 'development', debugId = 'stride.js'}) {
	const API_BASE_URL = env === "production" ? 'https://api.atlassian.com' : 'https://api.stg.atlassian.com'
	const API_AUDIENCE = env === "production" ? "api.atlassian.com" : "api.stg.atlassian.com"
	const AUTH_API_BASE_URL = env === "production" ? 'https://auth.atlassian.com' : 'https://atlassian-account-stg.pus2.auth0.com'

	function r2(options) {
		let logDetails = {
			...options
		}
		return new Promise((resolve, reject) => {
			logger.info({...logDetails}, `${debugId}: requesting...`)

			request(options, (err, response, body) => {
				if (err) {
					logger.error({...logDetails, err}, `${debugId}: request failed!`)
					return reject(err)
				}

				if (!response || response.statusCode >= 399) {
					logger.error({...logDetails, ...response, err}, `${debugId}: request failed with an error response!`)
					return reject(new Error('Request failed'))
				}

				resolve(body)
			})
		})
	}

	/**
	 * Get an access token from the Atlassian Identity API
	 */
	let token = null
	let accessTokenPromise = null
	async function getAccessToken() {
		if (token && Date.now() <= token.refresh_time) {
			// Reuse the cached token if any
			return token.access_token
		}

		if (accessTokenPromise) {
			// a request for a token is in-flight
			return accessTokenPromise
		}

		// Generate a new token
		const options = {
			uri: AUTH_API_BASE_URL + '/oauth/token',
			method: 'POST',
			json: {
				grant_type: "client_credentials",
				client_id: clientId,
				client_secret: clientSecret,
				"audience": API_AUDIENCE
			}
		}

		accessTokenPromise = r2(options)
			.then(token => {
				// remember to refresh the token a minute before it expires (tokens last for an hour)
				token.refresh_time = Date.now() + (token.expires_in - 60) * 1000
				logger.info({...token}, `${debugId}: got a token.`)
				return token.access_token
			})

		return accessTokenPromise
	}

	/**
	 * Functions to call the Stride API
	 */

	/** Send a message formatted in the Atlassian JSON format
	 * see https://developer.atlassian.com/cloud/stride/apis/document/structure/
	 * https://developer.atlassian.com/cloud/stride/apis/rest/#api-site-cloudId-conversation-conversationId-message-post
	 */
	async function sendDocumentMessage({cloudId, conversationId, documentMessage}) {
		if (!documentMessage.content || !Array.isArray(documentMessage.content))
			throw new Error('Stride/sendDocumentMessage: wrong message format!')

		const accessToken = await getAccessToken()
		const uri = API_BASE_URL + '/site/' + cloudId + '/conversation/' + conversationId + '/message'
		const options = {
				uri: uri,
				method: 'POST',
				headers: {
					authorization: "Bearer " + accessToken,
					"cache-control": "no-cache"
				},
				json: {
					body: documentMessage
				}
			}

		return r2(options)
	}

	/** Send a private message to a user
	 * https://developer.atlassian.com/cloud/stride/apis/rest/#api-site-cloudId-conversation-user-userId-message-post
	 */
	async function sendUserMessage({cloudId, userId, documentMessage}) {
		const accessToken = await getAccessToken()
		const options = {
			uri: API_BASE_URL + '/site/' + cloudId + '/conversation/user/' + userId + '/message',
			method: 'POST',
			headers: {
				authorization: "Bearer " + accessToken,
				"cache-control": "no-cache"
			},
			json: {
				body: documentMessage
			}
		}

		return r2(options)
	}

	/** Get infos about a conversation/room
	 * https://developer.atlassian.com/cloud/stride/apis/rest/#api-site-cloudId-conversation-conversationId-get
	 */
	async function getConversation({cloudId, conversationId}) {
		const accessToken = await getAccessToken()
		const options = {
			uri: API_BASE_URL + '/site/' + cloudId + '/conversation/' + conversationId,
			method: 'GET',
			headers: {
				authorization: "Bearer " + accessToken,
				"cache-control": "no-cache"
			}
		}

		return r2(options)
			.then(JSON.parse)
	}

	/* Create a room/conversation
   * https://developer.atlassian.com/cloud/stride/apis/rest/#api-site-cloudId-conversation-post
   */
	async function createConversation({cloudId, name, privacy = 'public', topic = ''}) {
		const accessToken = await getAccessToken()
		const body = {
			name,
			privacy,
			topic,
		}
		const options = {
			uri: API_BASE_URL + '/site/' + cloudId + '/conversation',
			method: 'POST',
			headers: {
				authorization: "Bearer " + accessToken,
				"cache-control": "no-cache"
			},
			json: body
		}

		return r2(options)
	}

	/**
	 * https://developer.atlassian.com/cloud/stride/apis/rest/#api-site-cloudId-conversation-conversationId-archive-put
	 */
	async function archiveConversation({cloudId, conversationId}) {
		const accessToken = await getAccessToken()
		const options = {
			uri: API_BASE_URL + '/site/' + cloudId + '/conversation/' + conversationId + '/archive',
			method: 'PUT',
			headers: {
				authorization: "Bearer " + accessToken,
				"cache-control": "no-cache"
			}
		}

		return r2(options)
	}

	/**
	 * https://developer.atlassian.com/cloud/stride/apis/rest/#api-site-cloudId-conversation-conversationId-message-get
	 */
	async function getConversationHistory(token, cloudId, conversationId, callback) {
		const accessToken = await getAccessToken()
		const options = {
			uri: API_BASE_URL + '/site/' + cloudId + '/conversation/' + conversationId + "/message?limit=5",
			method: 'GET',
			headers: {
				authorization: "Bearer " + accessToken,
				"cache-control": "no-cache"
			}
		}

		return r2(options)
	}

	/**
	 * https://developer.atlassian.com/cloud/stride/apis/rest/#api-site-cloudId-conversation-conversationId-roster-get
	 */
	async function getConversationRoster(token, cloudId, conversationId, callback) {
		const accessToken = await getAccessToken()
		const options = {
			uri: API_BASE_URL + '/site/' + cloudId + '/conversation/' + conversationId + "/roster",
			method: 'GET',
			headers: {
				authorization: "Bearer " + accessToken,
				"cache-control": "no-cache"
			}
		}

		return r2(options)
	}

	/**
	 * Send a file to a conversation. you can then include this file when sending a message
	 */
	async function sendMedia({cloudId, conversationId, name, stream}) {
		const accessToken = await getAccessToken()
		const options = {
			uri: API_BASE_URL + '/site/' + cloudId + '/conversation/' + conversationId + '/media?name=' + name,
			method: 'POST',
			headers: {
				authorization: "Bearer " + accessToken,
				'content-type': 'application/octet-stream'
			},
			body: stream
		}

		return r2(options)
	}

	/**
	 *
	 */
	async function updateGlanceState({cloudId, conversationId, glanceKey, stateTxt}) {
		const accessToken = await getAccessToken()
		const uri = API_BASE_URL + '/app/module/chat/conversation/chat:glance/' + glanceKey + '/state'
		const options = {
			uri,
			method: 'POST',
			headers: {
				authorization: "Bearer " + accessToken,
				"cache-control": "no-cache"
			},
			json: {
				"context": {
					cloudId,
					conversationId,
				},
				"label": stateTxt,
				"metadata": {}
			}
		}

		return r2(options)
	}

	/**
	 *
	 */
	async function updateConfigurationState({cloudId, conversationId, configKey, state}) {
		const accessToken = await getAccessToken()
		const uri = API_BASE_URL + '/app/module/chat/conversation/chat:configuration/' + configKey + '/state'
		const options = {
			uri: uri,
			method: 'POST',
			headers: {
				authorization: "Bearer " + accessToken,
				"cache-control": "no-cache"
			},
			json: {
				"context": {
					cloudId,
					conversationId,
				},
				"configured": state
			}
		}

		return r2(options)
	}

	/**
	 * Atlassian Users API
	 */
	async function getUser({cloudId, userId}) {
		const accessToken = await getAccessToken()
		const options = {
			uri: API_BASE_URL + '/scim/site/' + cloudId + '/Users/' + userId,
			method: 'GET',
			headers: {
				authorization: "Bearer " + accessToken,
				"cache-control": "no-cache"
			}
		}

		return r2(options)
			.then(JSON.parse)
	}

	/**
	 * Utility functions
	 */

	function sendTextMessage({cloudId, conversationId, text}) {
		return sendDocumentMessage({cloudId, conversationId, documentMessage: convertTextToDoc(text)})
	}

	// not sure that works!
	async function sendDocumentReply({message, reply}) {
		const cloudId = message.cloudId
		const conversationId = message.conversation.id // not existing!

		return sendDocumentMessage({cloudId, conversationId, reply})
	}

	// not sure that works!
	async function sendTextReply({message, replyTxt}) {
		const cloudId = message.cloudId
		const conversationId = message.conversation.id // not existing!

		return sendTextMessage({cloudId, conversationId, message: replyTxt})
	}

	/**
	 * Convert an Atlassian document to plain text
	 * see https://developer.atlassian.com/cloud/stride/apis/document/structure/
	 * Note: useless since we have that in message.text
	 */
	async function convertDocToText(document) {
		const accessToken = await getAccessToken()

		const options = {
			uri: API_BASE_URL + '/pf-editor-service/render',
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				accept: 'text/plain',
				authorization: "Bearer " + accessToken
			},
			json: document
		}

		return r2(options)
	}

	function convertTextToDoc(text) {
		return {
			version: 1,
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text,
						},
					],
				},
			],
		}
	}

	/**
	 * Securing your app with JWT
	 * --------------------------
	 * Whenever Stride makes a call to your app (webhook, glance, sidebar, bot), it passes a JSON Web Token (JWT).
	 * This token contains information about the context of the call (cloudId, conversationId, userId)
	 * This token is signed, and you should validate the signature, which guarantees that the call really comes from Stride.
	 * You validate the signature using the app's client secret.
	 *
	 * In this tutorial, the token validation is implemented as an Express middleware function which is executed
	 * in the call chain for every request the app receives from Stride.
	 * The function extracts the context of the call from the token and adds it to a local variable.
	 */

	function getJWT(req) {
		//Extract the JWT token from the request
		//Either from the "jwt" request parameter
		//Or from the "authorization" header, as "Bearer xxx"
		const encodedJwt = req.query['jwt']
			|| req.headers['authorization'].substring(7)
			|| req.headers['Authorization'].substring(7)

		console.log({encodedJwt})
		if  (!encodedJwt) {
			return null
		}

		// Decode the base64-encoded token, which contains the context of the call
		const decodedJwt = jwtUtil.decode(encodedJwt, null, true)

		const jwt = {encoded: encodedJwt, decoded: decodedJwt}

		return jwt
	}

	function validateJWT(req, res, next) {
		console.log('validateJWT')
		let logDetails = {
			debugId,
			endpoint: req.path,
			method: req.method,
		}

		try {
			const jwt = getJWT(req)

			console.log('---- JWT ---\n', jwt.decoded, '----\n')

			// Validate the token signature using the app's OAuth secret (created in DAC App Management)
			// (to ensure the call comes from Stride)
			jwtUtil.decode(jwt.encoded, clientSecret)

			//all good, it's from Stride
			logger.info({...logDetails}, 'JWT OK')

			// if any, add the context to a local variable
			if (jwt.decoded.context) {
				const conversationId = jwt.decoded.context.resourceId
				const cloudId = jwt.decoded.context.cloudId
				logDetails = {
					...logDetails,
					cloudId,
					conversationId,
				}
				req.strideContext = {cloudId, conversationId}
			}

			next()
		} catch (err) {
			logger.warn({...logDetails, err}, 'Invalid JWT')
			//res.sendStatus(403)
			next()
		}
	}


	return {
		getAccessToken,

		sendDocumentMessage,
		sendUserMessage,

		getConversation,
		createConversation,
		archiveConversation,
		getConversationHistory,
		getConversationRoster,

		sendMedia,
		updateGlanceState,
		updateConfigurationState,

		getUser,

		// utilities
		sendTextMessage,
		sendDocumentReply,
		sendTextReply,
		convertDocToText,
		convertTextToDoc,

		// middlewares
		validateJWT,
	}
}





export {
	factory,
}
