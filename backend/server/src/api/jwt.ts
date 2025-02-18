import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import Database from "../database/Database";

export default async function jwtRoutes(fastify: FastifyInstance) {
	fastify.get("/refresh", async (request, reply) => {
		
	})
}