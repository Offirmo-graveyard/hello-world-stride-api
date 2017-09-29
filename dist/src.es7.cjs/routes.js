"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const loggers_types_and_stubs_1 = require("@offirmo/loggers-types-and-stubs");
const healthcheck_1 = require("./endpoints/healthcheck");
const error_1 = require("./endpoints/error");
const demo_1 = require("./endpoints/demo");
const chucknorris_1 = require("./endpoints/chucknorris");
const captainamerica_1 = require("./endpoints/captainamerica");
const rpg_1 = require("./endpoints/rpg");
const batman_1 = require("./endpoints/batman");
const defaultDependencies = {
    logger: loggers_types_and_stubs_1.serverLoggerToConsole,
};
async function factory(dependencies = {}) {
    const { logger } = Object.assign({}, defaultDependencies, dependencies);
    logger.debug('Hello from main route!');
    const router = express.Router();
    router.use('/healthcheck', healthcheck_1.healthcheck);
    router.use('/error', error_1.error);
    router.use('/demo', await demo_1.factory({
        logger,
        clientId: process.env.STRIDE_APP_DEMO_STRIDE_API_CLIENT_ID,
        clientSecret: process.env.STRIDE_APP_DEMO_STRIDE_API_CLIENT_SECRET,
    }));
    router.use('/batman', await batman_1.factory({
        logger,
        clientId: process.env.STRIDE_APP_BATMAN_STRIDE_API_CLIENT_ID,
        clientSecret: process.env.STRIDE_APP_BATMAN_STRIDE_API_CLIENT_SECRET,
    }));
    router.use('/captainamerica', await captainamerica_1.factory({
        logger,
        clientId: process.env.STRIDE_APP_CAPTAIN_AMERICA_STRIDE_API_CLIENT_ID,
        clientSecret: process.env.STRIDE_APP_CAPTAIN_AMERICA_STRIDE_API_CLIENT_SECRET,
    }));
    router.use('/chucknorris', await chucknorris_1.factory({
        logger,
        clientId: process.env.STRIDE_APP_CHUCK_NORRIS_STRIDE_API_CLIENT_ID,
        clientSecret: process.env.STRIDE_APP_CHUCK_NORRIS_STRIDE_API_CLIENT_SECRET,
    }));
    /*
    router.use('/nickfury', await rpgFactory({
        logger,
        clientId: process.env.STRIDE_APP_NICK_FURY_STRIDE_API_CLIENT_ID,
        clientSecret: process.env.STRIDE_APP_NICK_FURY_STRIDE_API_CLIENT_SECRET,
    }))

    router.use('/wonderwoman', await rpgFactory({
        logger,
        clientId: process.env.STRIDE_APP_WONDER_WOMAN_STRIDE_API_CLIENT_ID,
        clientSecret: process.env.STRIDE_APP_WONDER_WOMAN_STRIDE_API_CLIENT_SECRET,
    }))
*/
    router.use('/rpg', await rpg_1.factory({
        logger,
        clientId: process.env.STRIDE_APP_RPG_STRIDE_API_CLIENT_ID,
        clientSecret: process.env.STRIDE_APP_RPG_STRIDE_API_CLIENT_SECRET,
    }));
    /*
    router.use('/', await rpgFactory({
        logger,
        clientId: process.env.STRIDE_APP__STRIDE_API_CLIENT_ID,
        clientSecret: process.env.STRIDE_APP__STRIDE_API_CLIENT_SECRET,
    }))
*/
    return router;
}
exports.factory = factory;
//# sourceMappingURL=routes.js.map