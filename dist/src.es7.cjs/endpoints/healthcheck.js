"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function healthcheck(req, res) {
    res.header('Content-Type', 'text/plain;charset=UTF-8');
    res.status(200).send('OK mate.');
}
exports.healthcheck = healthcheck;
//# sourceMappingURL=healthcheck.js.map