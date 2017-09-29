"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const express = require("express");
const request = require("request");
const loggers_types_and_stubs_1 = require("@offirmo/loggers-types-and-stubs");
const random_1 = require("@offirmo/random");
const stride_1 = require("../../lib/stride");
const misc_1 = require("../../lib/misc");
const defaultDependencies = {
    logger: loggers_types_and_stubs_1.serverLoggerToConsole,
    env: 'production',
};
const APP_ID = 'stride-app-captainamerica';
async function factory(dependencies = {}) {
    const { logger, env, clientId, clientSecret } = Object.assign({}, defaultDependencies, dependencies);
    logger.debug(`${APP_ID}: Initializing the bot…`);
    const rng = random_1.Random.engines.mt19937().autoSeed();
    if (!clientId || !clientSecret) {
        console.log(misc_1.prettify_json(process.env));
        throw new Error(`${APP_ID}: missing stride API credentials!`);
    }
    const stride = stride_1.factory({
        clientId,
        clientSecret,
        logger: logger,
        env,
        debugId: `${APP_ID} stride.js`
    });
    // preload the token (async)
    stride.getAccessToken();
    function r2(options) {
        let logDetails = Object.assign({}, options);
        return new Promise((resolve, reject) => {
            logger.info(Object.assign({}, logDetails), `${APP_ID}: requesting...`);
            request(options, (err, response, body) => {
                if (err) {
                    logger.error(Object.assign({}, logDetails, { err }), `${APP_ID}: request failed!`);
                    return reject(err);
                }
                if (!response || response.statusCode >= 399) {
                    logger.error(Object.assign({}, logDetails, response, { err }), `${APP_ID}: request failed with an error response!`);
                    return reject(new Error('Request failed'));
                }
                resolve(body);
            });
        });
    }
    function getRandomAssistanceMsg({ user }) {
        const mention = {
            type: "mention",
            attrs: {
                id: user.id,
                text: user.nickName || user.displayName,
            }
        };
        const content = random_1.Random.pick(rng, [
            [
                { type: "text", text: `I think ` },
                mention,
                { type: "text", text: `'s idea is good, you should listen to him.` },
            ],
            [
                mention,
                { type: "text", text: ` is a good man.` },
            ],
            [
                { type: "text", text: `I'm with ` },
                mention,
                { type: "text", text: ` till the end of the line.` },
            ],
        ]);
        return {
            version: 1,
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content,
                }
            ]
        };
    }
    function getRandomAdviceMsg() {
        return random_1.Random.pick(rng, [
            `Stand your ground!`,
            `I can do this all day!`,
            `If they hurt you, hurt them back.`,
        ]);
    }
    const app = express();
    // https://expressjs.com/en/starter/static-files.html
    // REM: respond with index.html when a GET request is made to the homepage
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(stride.validateJWT);
    app.post('/on-app-installed', (req, res, next) => {
        let logDetails = {
            endpoint: req.path,
            method: req.method,
            APP_ID,
        };
        (async function process() {
            const { cloudId, resourceId: conversationId, userId } = req.body;
            logDetails = Object.assign({}, logDetails, { cloudId,
                conversationId,
                userId });
            logger.info(logDetails, 'app installed in a conversation');
            stride.getConversation({ cloudId, conversationId })
                .then(conversation => {
                stride.sendTextMessage({
                    cloudId,
                    conversationId,
                    text: `I'm here to protect you, citizens.`
                });
            });
            res.sendStatus(204);
        })()
            .catch(next);
    });
    app.post('/on-app-uninstalled', (req, res, next) => {
        let logDetails = {
            APP_ID,
            endpoint: req.path,
            method: req.method,
        };
        (async function process() {
            const { cloudId, resourceId: conversationId, userId } = req.body;
            logDetails = Object.assign({}, logDetails, { cloudId,
                conversationId,
                userId });
            logger.info(logDetails, 'app uninstalled from a conversation');
            console.log(misc_1.prettify_json(req.body));
            res.sendStatus(204);
        })()
            .catch(next);
    });
    app.post('/on-bot-mentioned', (req, res, next) => {
        let logDetails = {
            APP_ID,
            endpoint: req.path,
            method: req.method,
        };
        (async function process() {
            const { cloudId, message: { text, body: document } } = req.body;
            const conversationId = req.body.conversation.id;
            const senderId = req.body.message.sender.id;
            logDetails = Object.assign({}, logDetails, { cloudId,
                conversationId,
                senderId });
            logger.info(logDetails, 'bot mentioned in a conversation');
            stride.getUser({ cloudId, userId: senderId }).then(user => {
                console.log('getUser():\n', misc_1.prettify_json(user));
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
                };
                return stride.sendDocumentMessage({
                    cloudId,
                    conversationId,
                    documentMessage,
                });
            });
            res.sendStatus(204);
        })()
            .catch(next);
    });
    app.post('/on-bot-directly-messaged', (req, res, next) => {
        let logDetails = {
            APP_ID,
            endpoint: req.path,
            method: req.method,
        };
        (async function process() {
            const { cloudId, message: { text, body: document } } = req.body;
            const conversationId = req.body.conversation.id;
            const senderId = req.body.message.sender.id;
            logDetails = Object.assign({}, logDetails, { cloudId,
                conversationId,
                senderId });
            logger.info(logDetails, 'bot directly messaged');
            stride.getUser({ cloudId, userId: senderId }).then(user => {
                return stride.sendUserMessage({
                    cloudId,
                    userId: senderId,
                    documentMessage: stride.convertTextToDoc(`Ah ah, I knew that you wanted to be my disciple, ${user.displayName}!`)
                });
            });
            res.sendStatus(204);
        })()
            .catch(next);
    });
    app.post('/on-any-message', (req, res, next) => {
        let logDetails = {
            APP_ID,
            endpoint: req.path,
            method: req.method,
        };
        (async function process() {
            const { cloudId, message: { text } } = req.body;
            const conversationId = req.body.conversation.id;
            const senderId = req.body.message.sender.id;
            logDetails = Object.assign({}, logDetails, { cloudId,
                conversationId,
                senderId });
            logger.info(logDetails, 'bot saw any message in a conversation');
            const txt = (text || '').toLowerCase();
            if (txt.includes('fuck')
                || txt.includes('shit')
                || txt.includes('wtf')) {
                stride.sendTextMessageDirectedToUser({
                    cloudId,
                    conversationId,
                    userId: senderId,
                    text: `Language!`
                });
            }
            res.sendStatus(204);
        })()
            .catch(next);
    });
    app.post('/on-custom-request', (req, res, next) => {
        let logDetails = {
            APP_ID,
            endpoint: req.path,
            method: req.method,
        };
        (async function process() {
            const { cloudId, conversationId } = req.strideContext;
            const { requestId, senderId } = req.body;
            logger.info(logDetails, 'bot received a custom request');
            const user = await stride.getUser({ cloudId, userId: senderId });
            switch (Number(requestId)) {
                case 1: {
                    stride.sendDocumentMessage({
                        cloudId,
                        conversationId,
                        documentMessage: getRandomAssistanceMsg({ user }),
                    });
                    break;
                }
                case 2: {
                    stride.sendTextMessage({ cloudId, conversationId, text: `My advice: ` + getRandomAdviceMsg() });
                    break;
                }
                case 3: {
                    r2({ method: 'GET', uri: 'https://api.chucknorris.io/jokes/random' })
                        .then(JSON.parse)
                        .then(({ value }) => stride.sendTextMessage({ cloudId, conversationId, text: 'Fact: ' + value }));
                    break;
                }
                default:
                    stride.sendTextMessageDirectedToUser({
                        cloudId,
                        conversationId,
                        userId: senderId,
                        text: `I m not yet understanding request "${requestId}"...`
                    });
                    break;
            }
            res.sendStatus(204);
        })()
            .catch(next);
    });
    app.get('/glance-state', /*cors(),*/ function (req, res) {
        res.send(JSON.stringify({
            "label": {
                "value": "Captain America"
            }
        }));
    });
    return app;
}
exports.factory = factory;
//# sourceMappingURL=index.js.map