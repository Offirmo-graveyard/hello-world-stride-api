"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const express = require("express");
const uuid = require("uuid");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const loggers_types_and_stubs_1 = require("@offirmo/loggers-types-and-stubs");
const routes_1 = require("./routes");
const defaultDependencies = {
    logger: loggers_types_and_stubs_1.serverLoggerToConsole,
    isHttps: false,
};
async function factory(dependencies = {}) {
    const { logger, isHttps } = Object.assign({}, defaultDependencies, dependencies);
    logger.debug('Initializing the top express app…');
    if (!isHttps)
        logger.warn('XXX please activate HTTPS on this server !');
    const app = express();
    // https://expressjs.com/en/4x/api.html#app.settings.table
    app.enable('trust proxy');
    app.disable('x-powered-by');
    app.use(function assignId(req, res, next) {
        req.uuid = uuid.v4();
        next();
    });
    // log the request as early as possible
    app.use((req, res, next) => {
        logger.info({
            uuid: req.uuid,
            method: morgan['method'](req),
            url: morgan['url'](req),
            referrer: morgan['referrer'](req),
        }, 'request received.');
        next();
    });
    // TODO activate CORS
    //app.use(helmet())
    app.use(bodyParser.urlencoded({
        extended: false,
        parameterLimit: 100,
        limit: '1Mb',
    }));
    app.use(bodyParser.json());
    app.use(await routes_1.factory({
        logger,
    }));
    app.use((req, res) => {
        logger.error(`! 404 on "${req.path}" !"`);
        res.status(404).end();
    });
    const errorHandler = (err, req, res, next) => {
        if (!err)
            err = new Error('unknown error');
        logger.error({ err }, 'app error handler: request failed!');
        const status = err.httpStatusHint || 500;
        res.status(status).send(`Something broke! Our devs are already on it! [${status}: ${http.STATUS_CODES[status]}]`);
    };
    app.use(errorHandler);
    return app;
}
exports.factory = factory;
//# sourceMappingURL=express-app.js.map