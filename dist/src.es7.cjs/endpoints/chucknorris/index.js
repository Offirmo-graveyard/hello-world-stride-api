"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const express = require("express");
const loggers_types_and_stubs_1 = require("@offirmo/loggers-types-and-stubs");
const request = require('request');
const stride_1 = require("../../lib/stride");
const misc_1 = require("../../lib/misc");
const defaultDependencies = {
    logger: loggers_types_and_stubs_1.serverLoggerToConsole,
    env: 'production',
};
const APP_ID = 'stride-app-chuck-norris';
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
    const app = express();
    // https://expressjs.com/en/starter/static-files.html
    // REM: respond with index.html when a GET request is made to the homepage
    app.use(express.static(path.join(__dirname, 'public')));
    app.post('/installed', (req, res, next) => {
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
            logger.info(logDetails, 'app installed in a conversation');
            stride.getConversation({ cloudId, conversationId }).then(conversation => {
                stride.sendTextMessage({
                    cloudId,
                    conversationId,
                    text: `Nobody moves! Chuck Norris is in ${conversation.name}!`
                });
                setTimeout(() => {
                    stride.sendTextMessage({
                        cloudId,
                        conversationId,
                        text: `One wrong move and you'll get round-kicked!`
                    });
                }, 5000);
            });
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
            stride.sendTextMessage({
                cloudId,
                conversationId,
                text: `I'm leaving for now. Stay quiet!`
            });
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
            const options = {
                uri: 'https://api.chucknorris.io/jokes/random',
                method: 'GET',
            };
            r2(options)
                .then(JSON.parse)
                .then(response => {
                console.log('CN facts response\n', misc_1.prettify_json(response));
                return stride.sendTextMessage({ cloudId, conversationId, text: response.value });
            });
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
    return app;
}
exports.factory = factory;
//# sourceMappingURL=index.js.map