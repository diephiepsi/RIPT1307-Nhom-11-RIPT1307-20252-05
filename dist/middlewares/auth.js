"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authOptional = authOptional;
exports.authRequired = authRequired;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authOptional(req, _res, next) {
    const h = req.headers.authorization;
    if (!h?.startsWith('Bearer '))
        return next();
    const token = h.slice('Bearer '.length);
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET ?? '');
        req.user = payload;
    }
    catch {
    }
    next();
}
function authRequired(req, res, next) {
    const h = req.headers.authorization;
    if (!h?.startsWith('Bearer '))
        return res.status(401).json({ message: 'Unauthorized' });
    const token = h.slice('Bearer '.length);
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET ?? '');
        req.user = payload;
        next();
    }
    catch {
        return res.status(401).json({ message: 'Invalid token' });
    }
}
