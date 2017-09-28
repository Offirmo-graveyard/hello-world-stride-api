const request = require('request')
//const jwtUtil = require('jwt-simple')


function factory({clientId, clientSecret, logger = console, env = 'development'}) {
	const API_BASE_URL = env === "production" ? 'https://api.atlassian.com' : 'https://api.stg.atlassian.com'
	const API_AUDIENCE = env === "production" ? "api.atlassian.com" : "api.stg.atlassian.com"
	const AUTH_API_BASE_URL = env === "production" ? 'https://auth.atlassian.com' : 'https://atlassian-account-stg.pus2.auth0.com'


	function r2(options) {
		let logDetails = {
			...options
		}
		return new Promise((resolve, reject) => {
			logger.info({...logDetails}, 'stride layer: requesting...')

			request(options, (err, response, body) => {
				if (err) {
					logger.error({...logDetails, err}, 'stride layer request failed!')
					return reject(err)
				}

				if (!response || response.statusCode >= 399) {
					logger.error({...logDetails, ...response, err}, 'stride layer request failed with an error response!')
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
	async function getAccessToken() {
		if (token && Date.now() <= token.refresh_time) {
			// Reuse the cached token if any
			return token.access_token
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

		token = await r2(options)

		// refresh the token a minute before it expires (tokens last for an hour)
		token.refresh_time = Date.now() + (token.expires_in - 60) * 1000
		return token.access_token
	}

	/**
	 * Functions to call the Stride API
	 */

	/** Send a message formatted in the Atlassian JSON format
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
	async function sendUserMessage({cloudId, userId, message}) {
		const accessToken = await getAccessToken()
		const options = {
			uri: API_BASE_URL + '/site/' + cloudId + '/conversation/user/' + userId + '/message',
			method: 'POST',
			headers: {
				authorization: "Bearer " + accessToken,
				"cache-control": "no-cache"
			},
			json: {
				body: message
			}
		}

		return r2(options)
	}

	/**
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

	/**
	 * Utility functions
	 */

	function sendTextMessage({cloudId, conversationId, message}) {
		const documentMessage = {
			version: 1,
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: message,
						},
					],
				},
			],
		}
		return sendDocumentMessage({cloudId, conversationId, documentMessage})
	}

	return {
		getAccessToken,

		sendDocumentMessage,
		sendUserMessage,
		getConversation,

		// utilities
		sendTextMessage,
		/*
		,
		getUser,
		createConversation,
		archiveConversation,
		getConversationHistory,
		getConversationRoster,
		sendDocumentReply,
		updateGlanceState,
		updateConfigurationState,
		sendTextReply,
		convertDocToText,
		sendMedia,
		*/
	}
}

export {
	factory,
}
