import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { authJwtMiddleware } from "@middleware/auth";
import Database from "@db/Database";
import jwt from "@utils/jwt";
import { JWT_REFRESH_SECRET } from "@config";



export default async function oauthRoutes(fastify: FastifyInstance) {
	fastify.get("/oauth/google", { preHandler: authJwtMiddleware }, async (request, reply) => {
		const user = await Database.getInstance().userTable.getById(request.user.id);
		return reply.code(200).send({ user: user.result });
	})

	fastify.get("/refresh", async (request, reply) => {
		if (!request.cookies || !request.cookies.refreshToken) {
			return reply.code(403).send({ message: "Unauthorized" });
		}
		const refreshToken = request.cookies.refreshToken;
		try {
			const verified = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
			if (!verified) return reply.code(403).send({ message: "Unauthorized" });
			const dbRes = await Database.getInstance().jwtBlackListTokensTable.exists(refreshToken);
			if (dbRes.error) {
				console.info("Error in jwtBlackListTokensTable.exists::", dbRes.error);
				return reply.code(403).send({ message: dbRes.error });
			}
			else {
				const decoded = jwt.decode(refreshToken);
				if (!decoded) return reply.code(403).send({ message: "Unauthorized" });
				const accessToken = jwt.sign({}, { exp: 60 * 15, sub: decoded.payload.id });
				const newRefreshToken = jwt.sign({}, { exp: 60 * 60 * 24 * 7, sub: decoded.payload.id }, JWT_REFRESH_SECRET);
				return reply.code(200)
					.setCookie("refreshToken", newRefreshToken, {
						httpOnly: true,
						sameSite: "strict",
						secure: false, // TODO: after enabling https make secure: true aswell
						expires: new Date(Date.now() + 60 * 60 * 24 * 7 * 1000) /* 1 Week */
					})
					.send({ accessToken });
			}
		} catch (error) {
			console.info("Error in jwtRoutes::refresh::", error);
			return reply.code(403).send({ message: "Unauthorized" });
		}
	})
}