import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import Database from "../database/Database";
import { request } from "http";
import { authJwtMiddleware } from "../middleware/auth";

export default async function jwtRoutes(fastify: FastifyInstance) {
	fastify.get("/me", {preHandler: authJwtMiddleware}, async (request, reply) => {
		
	})
	
	fastify.get("/refresh", async (request, reply) => {
		
	})
}