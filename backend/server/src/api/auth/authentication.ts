import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { userLoginSchema, userSignupSchema } from "@utils/userSchemas";
import { z } from "zod";
import Database from "@db/Database";
import { generateTokens, sendLoginResponse } from "@utils/auth";
import { connectedSocketClients } from "@api/websocket";
import { v4 } from "uuid";
import { websocketRegisterNewLogin } from "@utils/websocket";
import speakeasy from "speakeasy";

/**
 * path: /auth/
 */
export default async function authenticationRoutes(fastify: FastifyInstance) {
	/**
	 * Default SignUp
	 */
	fastify.post("/signup", async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			// validate inputs
			const parsed = userSignupSchema.parse(request.body);

			const displayName = parsed.displayName ?? parsed.username;
			const avatarUrl = parsed.avatarUrl ?? 'https://st2.depositphotos.com/1955233/8351/i/450/depositphotos_83513428-stock-photo-star-wars-storm-trooper-costume.jpg';

			// create new user
			const res = await Database.getInstance().userTable.new({
				username: parsed.username,
				displayName,
				avatarUrl,
				password: parsed.password,
				authProvider: parsed.authProvider,
			});
			if (res.error) {
				return reply.status(400).send({
					error: "Unexpected server error",
					ok: false
				})
			}
			const deviceId = v4()
			websocketRegisterNewLogin(res.result, deviceId);
			const tokens = generateTokens(res.result, deviceId);
			sendLoginResponse(reply, tokens);

		} catch (error) {
			if (error instanceof z.ZodError) {
				fastify.log.warn({
					type: "ValidationError",
					issues: error.flatten().fieldErrors,
				}, "Validation failed in /login");

				return reply.status(400).send({
					message: 'Validation error',
					errors: error.flatten().fieldErrors,
					ok: false,
				});
			} else if (error instanceof Error) {
				fastify.log.warn({
					type: "ApplicationError",
					error: error.message,
					stack: error.stack,
				});

				return reply.status(409).send({
					error: error.message,
					ok: false,
				});
			} else {
				fastify.log.error({
					type: "UnknownError",
					error,
				}, "Unexpected server error");

				return reply.status(500).send({
					error: 'Unexpected server error',
					ok: false,
				});
			}
		}
	});

	/**
	 * Default Login
	 */
	fastify.post("/login", async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			const parsed = userLoginSchema.parse(request.body);
			const { username, password, token } = parsed;

			const res = await Database.getInstance().userTable.login(username, password);
			if (res.error) {
				return reply.status(401).send({
					error: res.error.message,
					ok: false
				});
			}

			// 🔐 Проверка включена ли 2FA
			const db = Database.getInstance();
			const twofaEntry = await db.user2FATable.getByUserId(res.result.id);

			if (twofaEntry.result?.enabled) {
				if (!token) {
					return reply.status(403).send({
						error: "2FA_REQUIRED",
						ok: false
					});
				}

				const verified = speakeasy.totp.verify({
					secret: twofaEntry.result.secret,
					encoding: "base32",
					token,
					window: 1
				});

				if (!verified) {
					return reply.status(403).send({
						error: "Invalid 2fa code",
						ok: false,
						message: "Invalid 2fa code"
					});
				}
			}

			// 🔒 Проверка сессии
			if (connectedSocketClients.get(res.result.id)) {
				return reply.status(403).send({
					error: "User already connected in another device!",
					ok: false
				});
			}

			const deviceId = v4();
			websocketRegisterNewLogin(res.result.id, deviceId);
			const tokens = generateTokens(res.result.id, deviceId);
			sendLoginResponse(reply, tokens);

		} catch (error) {
			if (error instanceof Error) {
				fastify.log.warn({
					err: error,
					message: error.message,
				});
				return reply.status(401).send({
					error: error.message,
					ok: false,
				});
			} else {
				fastify.log.error({
					err: error,
					payload: request.body,
					msg: "Unhandled error in /login",
				});
				return reply.status(500).send({
					error: "Unexpected server error",
					ok: false,
				});
			}
		}
	});
}