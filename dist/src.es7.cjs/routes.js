"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const loggers_types_and_stubs_1 = require("@offirmo/loggers-types-and-stubs");
const healthcheck_1 = require("./endpoints/healthcheck");
const chucknorris_1 = require("./endpoints/chucknorris");
const defaultDependencies = {
    logger: loggers_types_and_stubs_1.serverLoggerToConsole,
};
async function factory(dependencies = {}) {
    const { logger } = Object.assign({}, defaultDependencies, dependencies);
    logger.debug('Hello from main route!');
    const router = express.Router();
    router.use('/healthcheck', healthcheck_1.healthcheck);
    router.use('/chucknorris', await chucknorris_1.factory({
        logger,
    }));
    return router;
}
exports.factory = factory;
//# sourceMappingURL=routes.js.map