import type { FastifyReply } from "fastify/types/reply";
import type { FastifyRequest } from "fastify/types/request";

export const authJwtMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
	console.log("cookies: ", request.cookies)

	if (!request.headers.authorization) {
		reply.code(401).send({ error: "Unauthorized" });
	}
}
