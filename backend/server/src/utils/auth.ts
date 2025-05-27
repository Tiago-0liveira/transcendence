import { FastifyReply } from "fastify";
import jwt from "@utils/jwt";
import DEFAULTS from "@utils/defaults";
import {JWT_REFRESH_SECRET} from "@config";
import { CookieName } from "@enums/auth";

// func for token generate
export function generateTokens(userId: number, deviceId: string) {
    const accessToken = jwt.sign({ }, DEFAULTS.jwt.accessToken.options(userId, deviceId));
    const refreshToken = jwt.sign({ }, DEFAULTS.jwt.refreshToken.options(userId, deviceId), JWT_REFRESH_SECRET);
    return { accessToken, refreshToken };
}

// func for send success response and set cookies
export function sendLoginResponse(reply: FastifyReply, tokens: { accessToken: string; refreshToken: string }) {
    return reply
        .code(200)
        .setCookie(CookieName.REFRESH_TOKEN, tokens.refreshToken, DEFAULTS.cookies.refreshToken.options())
        .header('Access-Control-Allow-Credentials', 'true')
        .send({ accessToken: tokens.accessToken, ok: true });
}