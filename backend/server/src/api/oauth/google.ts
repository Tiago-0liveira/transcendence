import type {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import Database from "@db/Database";
import jwt from "@utils/jwt";
import { GOOGLE_HAS_CREDENTIALS, GOOGLE_CLIENT_SECRET, FRONTEND_URL, GOOGLE_CLIENT_ID } from "@config";
import { OAuth2Client } from "google-auth-library";
import { UserAuthMethod } from "@enums/enums";
import DEFAULTS from "@utils/defaults";
import { googleOauthMiddleware, oauthJwtMiddleware } from "@middleware/google";
import { CookieName } from "@enums/auth";
import { connectedSocketClients } from "@api/websocket";
import { generateTokens } from "@utils/auth";
import { v4 } from "uuid";
import { websocketRegisterNewLogin } from "@utils/websocket";
import {getGooglePayload} from "@utils/oauth";
import { z } from "zod";
import {googleRequestSchema, googleSignupCompleteSchema} from "@utils/userSchemas";

export let googleClient: OAuth2Client | null = null;
if (GOOGLE_HAS_CREDENTIALS) {
	googleClient = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FRONTEND_URL);
}

/** 
 * path: /oauth/google/
*/
export default async function oauthGoogleRoutes(fastify: FastifyInstance) {

	/**
	 * Google login
	 */
	fastify.post("/login", {
		preHandler: [googleOauthMiddleware],
	}, async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			const parsed = googleRequestSchema.parse(request.body);
			const payload = await getGooglePayload(parsed, googleClient, reply);
			if (!payload) return;

			const db = Database.getInstance();
			const userIdResult = await db.userTable.existsGoogleId(Number(payload.sub));

			if (userIdResult.error) {
				fastify.log.error({
					type: "DatabaseError",
					error: userIdResult.error.message,
				}, "Database error in existsGoogleId");

				return reply.status(500).send({
					ok: false,
					error: "Internal server error",
				});
			}

			if (!userIdResult.result) {
				return reply.status(400).send({
					ok: false,
					error: "User does not exist!",
				});
			}

			const userId = userIdResult.result.id;

			if (connectedSocketClients.get(userId)) {
				return reply.status(403).send({
					ok: false,
					error: "User already connected in another device!",
				});
			}

			const deviceId = v4();
			websocketRegisterNewLogin(userId, deviceId);

			const { accessToken, refreshToken } = generateTokens(userId, deviceId);

			reply
				.code(200)
				.setCookie(CookieName.REFRESH_TOKEN, refreshToken, DEFAULTS.cookies.refreshToken.options())
				.header("Access-Control-Allow-Credentials", "true")
				.send({ accessToken });

		} catch (error) {
			if (error instanceof z.ZodError) {
				fastify.log.warn({
					type: "ValidationError",
					issues: error.flatten().fieldErrors,
				}, "Validation failed in /login");

				return reply.status(400).send({
					ok: false,
					message: "Validation error",
					errors: error.flatten().fieldErrors,
				});
			} else if (error instanceof Error) {
				fastify.log.warn({
					type: "ApplicationError",
					error: error.message,
					stack: error.stack,
				}, "Application error in /login");

				return reply.status(409).send({
					ok: false,
					error: error.message,
				});
			} else {
				fastify.log.error({
					type: "UnknownError",
					error,
				}, "Unexpected server error in /login");

				return reply.status(500).send({
					ok: false,
					error: "Unexpected server error",
				});
			}
		}
	});


	/**
	 * Google SignUp first handshake (sets `CookieName.OAUTH_GOOGLE_TOKEN` for completing the signup)
	 */
	fastify.post("/signup", {
		preHandler: [googleOauthMiddleware],
	}, async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			const parsed = googleRequestSchema.parse(request.body);

			const payload = await getGooglePayload(parsed, googleClient, reply);
			if (!payload) return;

			const user: RequestGooglePayload = {
				googleId: Number(payload.sub),
				name: payload.name as string,
				avatar: payload.picture as string,
			};

			const db = Database.getInstance();
			const userExists = await db.userTable.existsGoogleId(user.googleId);

			if (userExists.error) {
				return reply.status(500).send({
					ok: false,
					error: "Database error while checking user existence",
				});
			}

			if (userExists.result) {
				return reply.status(401).send({
					ok: false,
					error: "User already exists! Try logging in with Google",
				});
			}
			const token = jwt.sign(user, DEFAULTS.jwt.oauthToken.options(user.googleId));

			reply
				.setCookie(CookieName.OAUTH_GOOGLE_TOKEN, token, DEFAULTS.cookies.oauthToken.options())
				.send({ ok: true });

		} catch (error) {
			if (error instanceof z.ZodError) {
				fastify.log.warn({
					type: "ValidationError",
					issues: error.flatten().fieldErrors,
				}, "Validation failed in /signup");

				return reply.status(400).send({
					ok: false,
					message: "Validation error",
					errors: error.flatten().fieldErrors,
				});
			} else if (error instanceof Error) {
				fastify.log.warn({
					type: "ApplicationError",
					error: error.message,
					stack: error.stack,
				}, "Application error in /signup");

				return reply.status(409).send({
					ok: false,
					error: error.message,
				});
			} else {
				fastify.log.error({
					type: "UnknownError",
					error,
				}, "Unexpected server error");

				return reply.status(500).send({
					ok: false,
					error: "Unexpected server error",
				});
			}
		}
	});

	fastify.post("/signup/complete", {
		preHandler: [googleOauthMiddleware, oauthJwtMiddleware],
		schema: {
			body: {
				type: "object",
				required: ["username"],
				properties: {
					username: { type: "string" },
					displayName: { type: "string", nullable: true },
					avatarUrl: { type: "string", format: "uri", nullable: true }
				},
			},
		}
	}, async (request: FastifyRequest<{ Body: GoogleSignUpCompletePayload }>, reply) => {
		try {
			const googlePayload = request.googlePayload;
			const db = Database.getInstance();

			const parsed = googleSignupCompleteSchema.parse(request.body);

			const newUserData: UserParams = {
				username: parsed.username,
				displayName: parsed.displayName || parsed.username,
				avatarUrl: parsed.avatarUrl || googlePayload.avatar,
				authProvider: UserAuthMethod.GOOGLE,
				authProviderId: googlePayload.googleId,
				password: "", // No password for OAuth users
			};

			const newDbUser = await db.userTable.new(newUserData);

			if (newDbUser.error) {
				return reply.status(400).send({
					error: newDbUser.error.message,
					ok: false,
				});
			}


			const deviceId = v4();
			websocketRegisterNewLogin(newDbUser.result, deviceId);
			const { accessToken, refreshToken } = generateTokens(newDbUser.result, deviceId);

			reply
				.code(200)
				.clearCookie(CookieName.OAUTH_GOOGLE_TOKEN, DEFAULTS.cookies.oauthToken.clearOptions())
				.setCookie(CookieName.REFRESH_TOKEN, refreshToken, DEFAULTS.cookies.refreshToken.options())
				.header("Access-Control-Allow-Credentials", "true")
				.send({ accessToken, user: newDbUser.result });

		} catch (error) {
			if (error instanceof z.ZodError) {
				fastify.log.warn({
					type: "ValidationError",
					issues: error.flatten().fieldErrors,
				}, "Validation failed in /signup/complete");

				return reply.status(400).send({
					message: "Validation error",
					errors: error.flatten().fieldErrors,
					ok: false,
				});
			} else if (error instanceof Error) {
				fastify.log.warn({
					type: "ApplicationError",
					error: error.message,
					stack: error.stack,
				}, "Application error in /signup/complete");

				return reply.status(409).send({
					error: error.message,
					ok: false,
				});
			} else {
				fastify.log.error({
					type: "UnknownError",
					error,
				}, "Unexpected server error in /signup/complete");

				return reply.status(500).send({
					error: "Unexpected server error",
					ok: false,
				});
			}
		}
	});
}