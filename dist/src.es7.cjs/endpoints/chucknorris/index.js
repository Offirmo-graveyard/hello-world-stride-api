"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const express = require("express");
const loggers_types_and_stubs_1 = require("@offirmo/loggers-types-and-stubs");
const defaultDependencies = {
    logger: loggers_types_and_stubs_1.serverLoggerToConsole,
};
async function factory(dependencies = {}) {
    const { logger } = Object.assign({}, defaultDependencies, dependencies);
    logger.debug('Initializing the Chuck Norris Stride bot…');
    const app = express();
    // https://expressjs.com/en/starter/static-files.html
    // REM: respond with index.html when a GET request is made to the homepage
    app.use(express.static(path.join(__dirname, 'public')));
    app.get('/installed', (req, res, next) => {
        (async function render() {
            console.log('app installed in a conversation');
            res.sendStatus(204);
        })()
            .catch(next);
    });
    app.get('/uninstalled', (req, res, next) => {
        (async function render() {
            console.log('app uninstalled from a conversation');
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