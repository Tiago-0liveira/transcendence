import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import Database from "@db/Database";
import jwt from "@utils/jwt";
import { authJwtMiddleware } from "@middleware/auth";
import { JWT_REFRESH_SECRET } from "@config";
import { UserAuthMethod } from "@enums/enums";
import { OAuth2Client } from "google-auth-library";
import DEFAULTS from "@utils/defaults";

export default async function userRoutes(fastify: FastifyInstance) {
	fastify.post("/signin", {
		schema: {
			body: {
				type: "object",
				required: ["username", "password"],
				properties: {
					username: { type: "string" },
					displayName: { type: "string", nullable: true },
					avatarUrl: { type: "string", format: "uri", nullable: true },
					password: { type: "string" },
					authProvider: { type: "string", enum: Object.values(UserAuthMethod), default: UserAuthMethod.LOCAL },
				},
			},
		},
	}, async (request: FastifyRequest<{ Body: UserParams }>, reply: FastifyReply) => {
		// TODO: make this add the jwt cookies so the user log's in right away
		let { username, displayName, avatarUrl, password, authProvider } = request.body;

		if (!displayName)
			displayName = username;
		// TODO: add default avatarURL (maybe randomize)
		if (!avatarUrl)
			avatarUrl = "dummy URL"
		// TODO: validate all input

		try {
			const res = await Database.getInstance().userTable.new({ username, displayName, avatarUrl, password, authProvider })
			if (res.error)
				reply.code(400).send({ message: res.error })
			else 
				reply.code(200).send({ ok: true });
			
		} catch (error) {
			reply
				.code(400)
				.send({ message: error, ok: false })

		}
	});

	fastify.post("/login", {
		schema: {
			body: {
				type: "object",
				required: ["username", "password"],
				properties: {
					username: { type: "string" },
					password: { type: "string" },
				},
			}
		}
	}, async (request: FastifyRequest<{Body: { username: string, password: string }}>, reply) => {
		let { username, password } = request.body;

		try {
			const res = await Database.getInstance().userTable.login(username, password);
			if (res.error)
				reply.code(400).send({ message: res.error })
			else {
				const accessToken = jwt.sign({}, DEFAULTS.jwt.accessToken.options(String(res.result.id)))
				const refreshToken = jwt.sign({}, DEFAULTS.jwt.refreshToken.options(String(res.result.id)), JWT_REFRESH_SECRET)

				reply
					.code(200)
					.setCookie("refreshToken", refreshToken, DEFAULTS.cookies.oauthToken.options())
					.header('Access-Control-Allow-Credentials', 'true')
					.send({ accessToken: accessToken });
			}
		} catch (error) {
			reply.code(400).send({ message: error })
		}
	})

	fastify.post("/logout", { preHandler: authJwtMiddleware }, async (request, reply) => {
		reply
			.clearCookie("refreshToken")
			.send({ ok: true });
	})

	fastify.get("/:id", { preHandler: authJwtMiddleware }, async (request, reply) => {
		const { id } = request.params as { id: string };
		try {
			const numberId = Number(id);
			const res = await Database.getInstance().userTable.getById(numberId);
			if (res.error) {
				return reply.code(400).send({ message: res.error });
			}
			return { message: res.result };
		} catch (error) {
			return reply.code(400).send({ message: error })
		}
	});
}