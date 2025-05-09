import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import Database from "@db/Database";
import { UserAuthMethod } from "@enums/enums";
import { generateTokens, sendLoginResponse } from "@utils/auth";

/**
 * path: /auth/
 */
export default async function authenticationRoutes(fastify: FastifyInstance) {
	const userSignupSchema = z.object({
		username: z.string().min(3, 'Username must be at least 3 characters long'),
		displayName: z.string().min(3, 'Display name must be at least 3 characters').optional(),
		avatarUrl: z.string().url('Invalid avatar URL').optional(),
		password: z
			.string()
			.min(6, "Password must be at least 6 characters long")
			.refine(pw => /[A-Z]/.test(pw), {
				message: "Password must contain at least one uppercase letter",
			})
			.refine(pw => /\d/.test(pw), {
				message: "Password must contain at least one digit",
			})
			.refine(pw => /[^A-Za-z0-9]/.test(pw), {
				message: "Password must contain at least one special character",
			}),
		authProvider: z.nativeEnum(UserAuthMethod).optional().default(UserAuthMethod.LOCAL),
	});

	const userLoginSchema = z.object({
		username: z.string(),
		password: z.string(),
	});

	/**
	 * Default SignUp
	 */
	fastify.post("/signin", async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			// validate inputs
			const parsed = userSignupSchema.parse(request.body);

			const displayName = parsed.displayName ?? parsed.username;
			const avatarUrl = parsed.avatarUrl ?? 'https://st2.depositphotos.com/1955233/8351/i/450/depositphotos_83513428-stock-photo-star-wars-storm-trooper-costume.jpg'; // замените на ваш URL

			// create new user
			const res = await Database.getInstance().userTable.new({
				username: parsed.username,
				displayName,
				avatarUrl,
				password: parsed.password,
				authProvider: parsed.authProvider,
			});

			if ('error' in res) {
				return reply.code(400).send({ message: res.error, ok: false });
			}

			const userId = String(res.result);
			const tokens = generateTokens(userId);
			sendLoginResponse(reply, tokens);

		} catch (error) {
			if (error instanceof z.ZodError) {
				// validation errors
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
				// error like "user exist"
				fastify.log.warn({
					type: "ApplicationError",
					message: error.message,
					stack: error.stack,
				});

				return reply.status(409).send({
					message: error.message,
					ok: false,
				});
			} else {
				// unexpected errors
				fastify.log.error({
					type: "UnknownError",
					error,
				}, "Unexpected server error");

				return reply.status(500).send({
					message: 'Unexpected server error',
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
			const { username, password } = parsed;

			const res = await Database.getInstance().userTable.login(username, password);

			const userId = String(res.result?.id);
			const tokens = generateTokens(userId);
			sendLoginResponse(reply, tokens);

		} catch (error) {
			if (error instanceof Error) {
				fastify.log.warn({
					err: error,
					message: error.message,
				});
				return reply.status(401).send({
					message: error.message,
					ok: false,
				});
			} else {
				fastify.log.error({
					err: error,
					payload: request.body,
					msg: "Unhandled error in /login",
				});
				return reply.status(500).send({
					message: "Unexpected server error",
					ok: false,
				});
			}
		}
	});
}