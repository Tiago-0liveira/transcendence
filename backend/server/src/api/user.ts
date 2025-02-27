import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import Database from "../database/Database";
import jwt from "../utils/jwt";
import { authJwtMiddleware } from "../middleware/auth";
import { JWT_REFRESH_SECRET } from "../config";

export default async function userRoutes(fastify: FastifyInstance) {
	fastify.post("/", {
		schema: {
			body: {
				type: "object",
				required: ["username", "password"],
				properties: {
					username: { type: "string" },
					displayName: { type: "string", nullable: true },
					avatarUrl: { type: "string", format: "uri", nullable: true },
					password: { type: "string" },
				},
			},
		},
	}, async (request: FastifyRequest<{ Body: UserParams }>, reply: FastifyReply) => {
		let { username, displayName, avatarUrl, password } = request.body;

		if (!displayName)
			displayName = username;
		// TODO: add default avatarURL (maybe randomize)
		if (!avatarUrl)
			avatarUrl = "dummy URL"
		// TODO: validate all input

		try {
			const res = await Database.getInstance().userTable.new({ username, displayName, avatarUrl, password })
			if (res.error)
				reply.code(400).send({ message: res.error })
			else {
				const accessToken = jwt.sign({}, { exp: 60 * 15, sub: res.result })
				const refreshToken = jwt.sign({}, { exp: 60 * 60 * 24 * 7, sub: res.result }, JWT_REFRESH_SECRET)
				console.log("accessToken creation:", accessToken);

				reply
					.code(200)
					.setCookie("refreshToken", refreshToken, {
						httpOnly: true,
						sameSite: "strict",
						secure: false, // TODO: after enabling https make secure: true aswell
						expires: new Date(Date.now() + 60 * 60 * 24 * 7 * 1000) /* 1 Week */
					})
					.header('Access-Control-Allow-Credentials', 'true')
					.send({ message: res.result, accessToken });

			}
		} catch (error) {
			reply
				.code(400)
				.send({ message: error })

		}
	});

	// TODO: in the future if we implement JWT we can take the user id from the data stored in that token
	/*fastify.get("/me", async (request, reply) => {
		const {}
	})*/

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