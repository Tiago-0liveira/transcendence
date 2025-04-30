import type { FastifyReply } from "fastify/types/reply";
import type { FastifyRequest } from "fastify/types/request";
import { GOOGLE_AUTH_ENABLED } from "@config";
import jwt from "@utils/jwt";
import { googleClient } from "@api/oauth/google";


export const googleOauthMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
	if (!GOOGLE_AUTH_ENABLED || !googleClient)
	{
		return reply.code(400).send({error: "Google Oauth is not enabled!"})
	}
}

export const oauthJwtMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
	console.log("request cookies: ", request.cookies)
	if (!request.cookies || !request.cookies.oauthGoogleToken) {
		return reply.code(401).send({ error: "Unauthorized" })
	}
	const oauthGoogleToken = request.cookies.oauthGoogleToken;
	if (!jwt.verify(oauthGoogleToken)) {
		return reply.code(401).send({ error: "Unauthorized" })
	}
	const decoded = jwt.decode(oauthGoogleToken);
	if (!decoded || !decoded.payload)
	{
		return reply.code(401).send({ error: "Unauthorized" })
	}
	const googlePayload = decoded.payload.payload;
	request.googlePayload = googlePayload;

}