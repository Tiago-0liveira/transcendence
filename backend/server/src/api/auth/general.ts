import type { FastifyInstance } from "fastify";
import { authJwtMiddleware } from "@middleware/auth";
import Database from "@db/Database";

/**
 * path: /auth/
 */
export default async function AuthGeneralRoutes(fastify: FastifyInstance) {
	/**
	 * Gets the User and his information
	 */
	fastify.get("/me", { preHandler: authJwtMiddleware }, async (request, reply) => {
		const user = await Database.getInstance().userTable.getById(request.user.id);
		if (user.error) {
			console.warn("database error: userTable.getById::", user.error)
			return reply.code(500).send({ message: "Internal Database error" });
		}
		if (!user.result) {
			console.warn("/user/me user.result is null: request.user::", request.user);
			return reply.code(404).send({ message: "User is null, probably the user does not exist anymore!" });
		}
		return reply.code(200).send({ user: user.result });
	})
}