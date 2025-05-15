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
			const userId = request.user.id;

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
