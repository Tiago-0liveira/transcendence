import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { authJwtMiddleware } from "@middleware/auth";
import Database from "@db/Database";
import jwt from "@utils/jwt";
import { JWT_REFRESH_SECRET } from "@config";
import DEFAULTS from "@utils/defaults";

export default async function jwtRoutes(fastify: FastifyInstance) {
	fastify.get("/me", { preHandler: authJwtMiddleware }, async (request, reply) => {
		const user = await Database.getInstance().userTable.getById(request.user.id);
		if (user.error) {
			console.warn("database error: userTable.getById::", user.error)
			return reply.code(401).send({ message: "Internal Database error" });
		}
		if (!user.result)
		{
			console.warn("/auth/me user.result is null: request.user::", request.user);
			return reply.code(403).send({ message: "User is null, probably the user does not exist anymore!" });
		}
		return reply.code(200).send({ user: user.result });
	})

	fastify.get("/refresh", async (request, reply) => {
		if (!request.cookies || !request.cookies.refreshToken) {
			return reply.code(403).send({ message: "Unauthorized" });
		}
		const CookieRefreshToken = request.cookies.refreshToken;
		try {
			const verified = jwt.verify(CookieRefreshToken, JWT_REFRESH_SECRET);
			if (!verified) return reply.code(403).send({ message: "Unauthorized" });
			const dbRes = await Database.getInstance().jwtBlackListTokensTable.exists(CookieRefreshToken);
			if (dbRes.error) {
				console.info("Error in jwtBlackListTokensTable.exists::", dbRes.error);
				return reply.code(401).send({ message: dbRes.error });
			}
			
			const decoded = jwt.decode(CookieRefreshToken);
			if (!decoded || !decoded.payload || !decoded.payload.sub)
			{
				return reply.code(401).send({ message: "Invalid Token" });
			}
			const dbUser = await Database.getInstance().userTable.getById(decoded.payload.sub)
			if (dbUser.error)
			{
				console.info("Error in userTable.getById::", dbUser.error);
				return reply.code(403).send({ message: dbUser.error })
			}
			if (!dbUser.result) {
				return reply.code(401).send({ message: "The user does not exist anymore! "});
			}

			const accessToken = jwt.sign({}, DEFAULTS.jwt.accessToken.options(decoded?.payload.sub))
			const refreshToken = jwt.sign({}, DEFAULTS.jwt.refreshToken.options(decoded?.payload.sub), JWT_REFRESH_SECRET)

			return reply
				.code(200)
				.setCookie("refreshToken", refreshToken, DEFAULTS.cookies.refreshToken.options())
				.header('Access-Control-Allow-Credentials', 'true')
				.send({ accessToken: accessToken });
			
		} catch (error) {
			console.info("Error in jwtRoutes::refresh::", error);
			return reply.code(403).send({ message: "Unauthorized" });
		}
	})
}