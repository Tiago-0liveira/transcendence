import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import Database from "@db/Database";
import jwt from "@utils/jwt";
import { JWT_REFRESH_SECRET } from "@config";
import { UserAuthMethod } from "@enums/enums";
import { CookieName } from "@enums/auth";
import DEFAULTS from "@utils/defaults";

/**
 * path: /auth/
 */
export default async function authenticationRoutes(fastify: FastifyInstance) {
	/**
	 * Default SignUp
	 */
	fastify.post("/signup", {
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
				return reply.code(400).send({ message: res.error })
			else {
				const accessToken = jwt.sign({}, DEFAULTS.jwt.accessToken.options(res.result))
				const refreshToken = jwt.sign({}, DEFAULTS.jwt.refreshToken.options(res.result), JWT_REFRESH_SECRET)

				reply
					.code(200)
					.setCookie(CookieName.REFRESH_TOKEN, refreshToken, DEFAULTS.cookies.oauthToken.options())
					.header('Access-Control-Allow-Credentials', 'true')
					.send({ accessToken: accessToken, ok: true });
			}

		} catch (error) {
			reply
				.code(400)
				.send({ message: error, ok: false })

		}
	});

	/**
	 * Default Login
	 */
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
	}, async (request: FastifyRequest<{ Body: { username: string, password: string } }>, reply) => {
		let { username, password } = request.body;

		try {
			const res = await Database.getInstance().userTable.login(username, password);
			if (res.error) {
				console.log("Error in userTable.login::", res.error)
				reply.code(400).send({ message: res.error })
			}
			else {
				const accessToken = jwt.sign({}, DEFAULTS.jwt.accessToken.options(res.result.id))
				const refreshToken = jwt.sign({}, DEFAULTS.jwt.refreshToken.options(res.result.id), JWT_REFRESH_SECRET)

				reply
					.code(200)
					.setCookie(CookieName.REFRESH_TOKEN, refreshToken, DEFAULTS.cookies.refreshToken.options())
					.header('Access-Control-Allow-Credentials', 'true')
					.send({ accessToken: accessToken });
			}
		} catch (error) {
			reply.code(400).send({ message: error })
		}
	})
}