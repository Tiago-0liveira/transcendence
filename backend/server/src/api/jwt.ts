import { JWT_REFRESH_SECRET } from "@config";
import Database from "@db/Database";
import { CookieName } from "@enums/auth";
import { authJwtMiddleware } from "@middleware/auth";
import { generateTokens } from "@utils/auth";
import DEFAULTS from "@utils/defaults";
import jwt from "@utils/jwt";
import { userCanLogIn } from "@utils/websocket";
import type { FastifyInstance } from "fastify";

/**
 * path: /jwt
 */
export default async function jwtRoutes(fastify: FastifyInstance) {
	/**
	 * Refreshes JWT tokens returning both a new accessToken and refreshToken
	 * @requires refreshToken in http only cookie
	 */
	fastify.get("/refresh", async (request, reply) => {
		if (!request.cookies || !request.cookies.refreshToken) {
			return reply.code(401).send({ message: "Unauthorized" });
		}
		const CookieRefreshToken = request.cookies.refreshToken;
		try {
			const verified = jwt.verify(CookieRefreshToken, JWT_REFRESH_SECRET);
			if (!verified) return reply.code(401).send({ message: "Unauthorized" });
			const dbRes = await Database.getInstance().jwtBlackListTokensTable.exists(CookieRefreshToken);
			if (dbRes.result) {
				return reply.code(401).send({ message: new Error("Token already used") });
			}

			const decoded = jwt.decode<RefreshTokenPayload>(CookieRefreshToken);
			if (!decoded || !decoded.payload || !decoded.payload.sub) {
				return reply.code(400).send({ message: "Invalid Token" });
			}
			const dbUser = await Database.getInstance().userTable.getById(decoded.payload.sub)
			if (dbUser.error) {
				console.info("Error in userTable.getById::", dbUser.error);
				return reply.code(500).send({ message: dbUser.error })
			}
			if (!dbUser.result) {
				return reply.code(404).send({ message: "The user does not exist anymore! " });
			}
			if (!userCanLogIn(dbUser.result.id, decoded.payload.deviceId))
			{
				return reply.code(403).send({ message: "User already connected in another device!" });
			}
			const deviceId = decoded.payload.deviceId;
			const { accessToken, refreshToken } = generateTokens(decoded.payload.sub, deviceId)

			return reply
				.code(200)
				.setCookie(CookieName.REFRESH_TOKEN, refreshToken, DEFAULTS.cookies.refreshToken.options())
				.header('Access-Control-Allow-Credentials', 'true')
				.send({ accessToken: accessToken });

		} catch (error) {
			console.info("Error in jwtRoutes::refresh::", error);
			return reply.code(401).send({ message: "Unauthorized" });
		}
	})

	/**
	 * Logs out the user by clearing its refreshToken from the http only cookies
	 */
	fastify.get("/refresh/logout", { preHandler: authJwtMiddleware }, async (request, reply) => {
		reply
			.code(200)
			.clearCookie(CookieName.REFRESH_TOKEN, DEFAULTS.cookies.refreshToken.clearOptions())
			.send({ ok: true });
	})
}