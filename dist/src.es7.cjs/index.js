"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const bunyan = require("bunyan");
const express_app_1 = require("./express-app");
async function factory() {
    console.log('Starting_');
    // TODO plug to a syslog
    const logger = bunyan.createLogger({
        name: 'ServerX',
        level: 'debug',
        serializers: bunyan.stdSerializers,
    });
    logger.info('Logger ready.');
    process.on('uncaughtException', (err) => {
        console.error(`Uncaught exception!`, err);
        setTimeout(() => process.exit(1), 250);
        logger.fatal(err, `Uncaught exception!`);
        // TODO cleanup
        // I've an experimental module for that…
    });
    process.on('unhandledRejection', (reason, p) => {
        console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
        setTimeout(() => process.exit(1), 250);
        logger.fatal({ reason, p }, `Uncaught rejection!`);
        // TODO cleanup
        // I've an experimental module for that…
    });
    process.on('warning', (warning) => {
        console.warn(warning);
        logger.warn(warning);
    });
    logger.debug('Now listening to uncaughts and warnings.');
    const config = {
        port: process.env.PORT || 3333,
        isHttps: (process.env.IS_HTTPS === 'true'),
    };
    const server = http_1.createServer(await express_app_1.factory({
        logger,
        isHttps: config.isHttps,
    }));
    server.listen(config.port, (err) => {
        if (err) {
            console.error(`Server error!`, err);
            logger.fatal(err, `Server error!`);
            return;
        }
        logger.info(`Server launched, listening on :${config.port}`);
    });
}
factory()
    .catch(e => {
    console.error('Server failed to launch:', e.message);
});
//# sourceMappingURL=index.js.map