import { FastifyInstance } from "fastify";
import { authJwtMiddleware } from "@middleware/auth";
import { activeGameRooms } from "@api/websocket";
import { getBasicLobby, userCanJoinLobby } from "@game/lobby";
import Database from "@db/Database";

const db = Database.getInstance()

export default async function gameRoutes(fastify: FastifyInstance) {
	fastify.post<{
		Body: {
			targetId?: number;
		};
	}>("/rooms", { preHandler: authJwtMiddleware }, async (request, reply) => {
		const { targetId } = request.body;
		console.log(request.query, request.body)
		if (targetId === undefined) {
			return reply.status(400).send({
                ok: false,
                message: "Invalid target user Id"
            });
		}
		const rooms: BasicPublicLobby[] = []
		activeGameRooms.forEach(room => {
			const isFriend = db.friendsTable.getRelationBetweenUsers(room.owner, targetId)
			if (userCanJoinLobby(room, targetId, isFriend)) {
				rooms.push(getBasicLobby(room, targetId, isFriend))
			}
		})
		return reply.status(200).send({ rooms })
	});
}