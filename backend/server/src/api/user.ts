import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { request } from "http";
import Database from "../database/Database";

export default async function userRoutes(fastify: FastifyInstance) {
	fastify.get("/", async (request, reply) => {
		return { message: "List of users" };
	});

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

		const res = await Database.getInstance().userTable.new({ username, displayName, avatarUrl, password })
		if (res.error)
			reply.code(400).send({ message: res.error })
		else
			reply.code(200).send({ message: res.result })
	});

	// TODO: in the future if we implement JWT we can take the user id from the data stored in that token
	/*fastify.get("/me", async (request, reply) => {
		const {}
	})*/

	fastify.get("/:id", async (request, reply) => {
		const { id } = request.params as { id: string };
		try {
			const numberId = Number(id);
			const res = await Database.getInstance().userTable.getById(numberId);
			if (res.error)
			{
				return reply.code(400).send({message: res.error});
			} else {
				return {message: res.result};
			}
			return { message: res.result };
		} catch (error) {
			return reply.code(400).send({message: error})
		}
	});
}