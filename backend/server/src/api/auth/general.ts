import type { FastifyInstance } from "fastify";
import { authJwtMiddleware } from "@middleware/auth";
import Database from "@db/Database";

/**
 * path: /auth/
 */
export default async function AuthGeneralRoutes(fastify: FastifyInstance) {
	/**
	 * Returns the authenticated user's profile
	 */
	fastify.get("/me", { preHandler: authJwtMiddleware }, async (request, reply) => {
		try {
			const userId = request.user?.id;
			fastify.log.info({ user: request.user }, "Decoded JWT user object");

			if (!userId) {
				fastify.log.warn({ msg: "/me accessed without user ID", user: request.user });
				return reply.status(400).send({
					message: "Invalid or missing user ID",
					ok: false,
				});
			}

			fastify.log.warn({ msg: "/me accessed without user ID", user: userId });
			const user = await Database.getInstance().userTable.getById(userId);

			if (user.error) {
				fastify.log.error({ err: user.error, userId }, "Database error in getById");
				return reply.status(500).send({
					message: "Internal database error",
					ok: false,
				});
			}

			if (!user.result) {
				fastify.log.info({ userId }, "User not found in /me");
				return reply.status(404).send({
					message: "User not found. Possibly deleted.",
					ok: false,
				});
			}

			return reply.status(200).send({
				user: user.result,
				ok: true,
			});
		} catch (error) {
			fastify.log.error({ err: error }, "Unhandled error in /me");
			return reply.status(500).send({
				message: "Unexpected server error",
				ok: false,
			});
		}
	});
}
// export default async function AuthGeneralRoutes(fastify: FastifyInstance) {
// 	/**
// 	 * Gets the User and his information
// 	 */
// 	fastify.get("/me", { preHandler: authJwtMiddleware }, async (request, reply) => {
// 		const user = await Database.getInstance().userTable.getById(request.user.id);
// 		if (user.error) {
// 			console.warn("database error: userTable.getById::", user.error)
// 			return reply.code(500).send({ message: "Internal Database error" });
// 		}
// 		if (!user.result) {
// 			console.warn("/user/me user.result is null: request.user::", request.user);
// 			return reply.code(404).send({ message: "User is null, probably the user does not exist anymore!" });
// 		}
// 		return reply.code(200).send({ user: user.result });
// 	})
// }