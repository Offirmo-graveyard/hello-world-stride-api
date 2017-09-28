"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const express = require("express");
const loggers_types_and_stubs_1 = require("@offirmo/loggers-types-and-stubs");
const stride_1 = require("../../lib/stride");
const misc_1 = require("../../lib/misc");
const defaultDependencies = {
    logger: loggers_types_and_stubs_1.serverLoggerToConsole,
    env: 'production',
};
const APP_ID = 'stride-app-demo';
async function factory(dependencies = {}) {
    const { logger, env, clientId, clientSecret } = Object.assign({}, defaultDependencies, dependencies);
    logger.debug(`${APP_ID}: Initializing the bot…`);
    if (!clientId || !clientSecret) {
        console.log(misc_1.prettify_json(process.env));
        throw new Error(`${APP_ID}: missing stride API credentials!`);
    }
    const stride = stride_1.factory({
        clientId,
        clientSecret,
        logger: logger,
        env,
        debugId: `${APP_ID}stride.js`
    });
    // preload the token (async)
    stride.getAccessToken();
    const app = express();
    // https://expressjs.com/en/starter/static-files.html
    // REM: respond with index.html when a GET request is made to the homepage
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(stride.validateJWT);
    app.post('/installed', (req, res, next) => {
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
            console.log(misc_1.prettify_json(req.body));
            res.sendStatus(204);
        })()
            .catch(next);
    });
    app.post('/uninstalled', (req, res, next) => {
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
    app.post('/bot-mentioned', (req, res, next) => {
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
            //console.log('------\nfull body\n', prettify_json(req.body))
            //console.log('------\ndocument\n', prettify_json(document))
            stride.sendTextMessage({ cloudId, conversationId, text: '"stride.sendTextMessage()"' });
            /*stride.sendDocumentMessage({
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
                    documentMessage : stride.convertTextToDoc(`stride.getUser(): I'll remember that you said "${text}", "${user.displayName}"!`)
                })
            })
            stride.convertDocToText(document).then(msg => {
                return stride.sendTextMessage({cloudId, conversationId, text: `stride.convertDocToText(): was your message "${msg}"?`})
            })
    */
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
            res.sendStatus(204);
        })()
            .catch(next);
    });
    app.post('/bot-directly-messaged', (req, res, next) => {
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
            //console.log('------\nfull body\n', prettify_json(req.body))
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
    app.get('/glance-state', 
    // cross domain request
    //cors(),
    function (req, res) {
        res.send(JSON.stringify({
            "label": {
                "value": "Click me!"
            }
        }));
    });
    app.post('/custom-request', (req, res, next) => {
        let logDetails = {
            APP_ID,
            endpoint: req.path,
            method: req.method,
        };
        (async function process() {
            const { cloudId, conversationId } = req.strideContext;
            const { requestId, senderId } = req.body;
            logger.info(logDetails, 'bot received a custom request');
            console.log('------\nfull body\n', misc_1.prettify_json(req.body));
            stride.sendTextMessage({ cloudId, conversationId, text: '"stride.sendTextMessage()"' });
            res.sendStatus(204);
        })()
            .catch(next);
    });
    return app;
}
exports.factory = factory;
//# sourceMappingURL=index.js.map