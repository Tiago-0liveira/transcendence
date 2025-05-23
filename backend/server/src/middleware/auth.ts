import type { FastifyReply } from "fastify/types/reply";
import type { FastifyRequest } from "fastify/types/request";
import jwt from "@utils/jwt";


export const authJwtMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
	if (!request.headers.authorization || !request.headers.authorization.startsWith("Bearer ")) {
		return reply.code(401).send({ error: "Unauthorized" });
	}
	const accessToken = request.headers.authorization.split(" ")[1];
	if (!jwt.verify(accessToken)) {
		return reply.code(401).send({ error: "Unauthorized" })
	}
	const decodedToken = jwt.decode<AccessTokenPayload>(accessToken);
	if (decodedToken && decodedToken.payload && decodedToken.payload.sub) {
		request.user = { 
			id: decodedToken.payload.sub, 
			deviceId: decodedToken.payload.deviceId
		};
	} else {
		console.warn("authJwtMiddleware failed for token: ", accessToken);
		return reply.code(401).send({ error: "Unauthorized" })
	}
}
