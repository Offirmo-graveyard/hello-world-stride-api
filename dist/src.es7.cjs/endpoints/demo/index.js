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
    logger.debug(`${APP_ID}: Initializing the Demo Stride bot…`);
    if (!clientId || !clientSecret)
        throw new Error(`${APP_ID}: missing stride API credentials!`);
    const stride = stride_1.factory({ clientId, clientSecret, logger: logger, env });
    const app = express();
    // https://expressjs.com/en/starter/static-files.html
    // REM: respond with index.html when a GET request is made to the homepage
    app.use(express.static(path.join(__dirname, 'public')));
    app.post('/installed', (req, res, next) => {
        let logDetails = {
            endpoint: req.path,
            method: req.method,
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
            endpoint: req.path,
            method: req.method,
        };
        (async function process() {
            const { cloudId } = req.body;
            const conversationId = req.body.conversation.id;
            const senderId = req.body.message.sender.id;
            logDetails = Object.assign({}, logDetails, { cloudId,
                conversationId,
                senderId });
            logger.info(logDetails, 'bot mentioned in a conversation');
            console.log(misc_1.prettify_json(req.body));
            stride.sendTextMessage({ cloudId, conversationId, message: '"sendTextMessage()"' });
            stride.sendDocumentMessage({ cloudId, conversationId, documentMessage: {
                    version: 1,
                    type: "doc",
                    content: [
                        {
                            type: "paragraph",
                            content: [
                                {
                                    type: "text",
                                    text: '"sendDocumentMessage()"',
                                },
                            ],
                        },
                    ],
                } });
            stride.sendUserMessage({ cloudId, userId: senderId, message: {
                    version: 1,
                    type: "doc",
                    content: [
                        {
                            type: "paragraph",
                            content: [
                                {
                                    type: "text",
                                    text: '"sendUserMessage()"',
                                },
                            ],
                        },
                    ],
                } });
            Promise.resolve().then(async function () {
                const conversation = await stride.getConversation({ cloudId, conversationId });
                console.log('getConversation():\n', misc_1.prettify_json(conversation));
                return stride.sendTextMessage({ cloudId, conversationId, message: `nice room "${conversation.name}"!` });
            });
            res.sendStatus(204);
        })()
            .catch(next);
    });
    /*
/bot-mention
/uninstalled
*/
    return app;
}
exports.factory = factory;
//# sourceMappingURL=index.js.map