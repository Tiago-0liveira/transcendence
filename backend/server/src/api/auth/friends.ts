import { connectedSocketClients } from "@api/websocket";
import Database from "@db/Database";
import { authJwtMiddleware } from "@middleware/auth";
import { notify } from "@utils/websocket";
import type { FastifyInstance } from "fastify"

/**
 * path: /auth/friends
 */
export default async function friendsRoutes(fastify: FastifyInstance) {
	// Friends

	/**
	 * Gets possibleFriends
	 */
	fastify.get<{
		Querystring: {
			name: string,
			page?: number;
			limit?: number;
		};
	}>("/possibleFriends", {
		preHandler: authJwtMiddleware
	}, async (request, reply) => {
		const userId = request.user.id;
		let { name, page = 1, limit = 50 } = request.query;
		let offset = (page - 1) * limit;
		name = name.trim();

		const dbRes = await Database.getInstance().friendsTable.getPossibleFriends(userId, name, offset, limit)
		console.log("Потенциальный друг: ", dbRes)
		if (dbRes.error) {
			return reply.code(500).send(dbRes)
		}
		dbRes.result.forEach(possibleFriend => {
			const connectedSocket = connectedSocketClients.get(possibleFriend.id)
			if (connectedSocket && connectedSocket.connected) {
				possibleFriend.online = true
			}
		})

		return reply.code(200).send({ users: dbRes.result })
	})

	/**
	 * Gets user friends
	 */
	fastify.get<{
		Querystring: {
			page?: number;
			limit?: number;
		};
	}>("/me", { preHandler: authJwtMiddleware }, async (request, reply) => {
		const { page = 1, limit = 50 } = request.query;
		const offset = (page - 1) * limit;
		const userId = request.user.id;

		const friendsRes = await Database.getInstance().friendsTable.getFriendsWithInfo(userId, offset, limit);

		if (friendsRes.error) {
			return reply.code(500).send(friendsRes.error);
		}

		return reply.code(200).send({ friends: friendsRes.result });
	})

	fastify.get<{
		Querystring: {
			page?: number;
			limit?: number;
		};
	}>("/blocked", { preHandler: authJwtMiddleware }, async (request, reply) => {
		const { page = 1, limit = 50 } = request.query;
		const offset = (page - 1) * limit;
		const userId = request.user.id;

		const blockedRes = await Database.getInstance().friendsTable.getBlockedUsersWithInfo(userId, offset, limit);
		if (blockedRes.error) {
			return reply.code(500).send(blockedRes.error);
		}

		return reply.code(200).send({ blocked: blockedRes.result });
	});


	/**
	 * Sends a new friend request
	 */
	fastify.post<{
		Body: {
			userId: string
		};
	}>("/add", {
		preHandler: authJwtMiddleware,
		schema: {
			body: {
				type: "object",
				required: ["userId"],
				properties: {
					userId: { type: "string" },
				},
			}
		}
	}, async (request, reply) => {
		const { userId: userIdStr } = request.body;
		const senderId = request.user.id;

		try {
			const receiverId = Number(userIdStr);

			const user = await Database.getInstance().userTable.getById(receiverId);
			if (user.error) {
				return reply.code(500).send(user)
			}
			if (!user.result) {
				return reply.code(404).send({ message: "Invalid userId " })
			}
			const friendRequest = await Database.getInstance().friendRequestsTable.new({ receiverId, senderId })
			if (friendRequest.error) {
				return reply.code(422).send({ message: friendRequest.error.message })
			}
			await notify.friendRequest(senderId, receiverId);
			return reply.code(201).send({})
		} catch (e) {
			console.error("Exception in /remove handler:", e);
			return reply.code(500).send({ message: "Internal server error" });
		}
	})

	/**
	 * Removes friend
	 */
	fastify.post<{
		Body: {
			userId: string;
		};
	}>("/remove", {
		preHandler: authJwtMiddleware,
		schema: {}
	}, async (request, reply) => {
		const { userId: userIdStr } = request.body;
		const receiverId = request.user.id;

		if (!userIdStr || isNaN(Number(userIdStr))) {
			return reply.code(400).send({ message: "Invalid userId" });
		}

		const senderId = Number(userIdStr);
		const db = Database.getInstance().friendsTable;

		try {
			console.log("receiverId: ", receiverId);
			console.log("senderId: ", senderId);

			const relation = db.getRelationBetweenUsers(receiverId, senderId);

			const res = db.deleteSpecificRelation(receiverId, senderId, relation ? "accepted" : "rejected");
			if (res.error) {
				return reply.code(500).send(res);
			}

			return reply.code(200).send({ removedStatus: relation });
		} catch (e) {
			console.error("Exception in /remove handler:", e);
			return reply.code(500).send({ message: "Internal server error" });
		}
	});




	// Friends requests

	/**
	 * Gets User pending requests
	 */
	fastify.get<{
		Querystring: {
			page?: number;
			limit?: number;
		};
	}>("/requests", { preHandler: authJwtMiddleware }, async (request, reply) => {
		const { page = 1, limit = 50 } = request.query;
		const offset = (page - 1) * limit;
		const userId = request.user.id;

		const friendsRes = await Database.getInstance().friendRequestsTable.getFriendRequestsWithInfo(userId, offset, limit)
		if (friendsRes.error) {
			return reply.code(500).send(friendsRes);
		}

		return reply.code(200).send({ requests: friendsRes.result });
	})

	/**
	 * Cancels outgoing friend request
	 */
	fastify.post<{
		Body: {
			userId: string
		};
	}>("/requests/pending/cancel", {
		preHandler: authJwtMiddleware,
		schema: {}
	}, async (request, reply) => {
		const { userId: userIdStr } = request.body;
		const userId = request.user.id;

		try {
			const friendId = Number(userIdStr);

			const dbRes = await Database.getInstance().friendRequestsTable.delete(userId, friendId);
			if (dbRes.error) {
				return reply.code(422).send(dbRes);
			}
		} catch (e) {
			return reply.code(400).send({ message: "Invalid userId" })
		}

		return reply.code(200).send({});
	})

	/**
	 * Accepts incoming friend request
	 */
	fastify.post<{
		Body: {
			userId: string
		}
	}>("/requests/accept", {
		preHandler: authJwtMiddleware,
		schema: {
			body: {
				type: "object",
				required: ["userId"],
				properties: {
					userId: { type: "string" },
				},
			}
		}
	}, async (request, reply) => {
		const { userId: userIdStr } = request.body;
		const senderId = request.user.id;

		try {
			const receiverId = Number(userIdStr);

			const dbRes = await Database.getInstance().friendRequestsTable.acceptRequest(senderId, receiverId);
			if (dbRes.error) {
				return reply.code(422).send(dbRes);
			}
			const dbRes2 = await Database.getInstance().friendsTable.new({ userId: senderId, friendId: receiverId });
			if (dbRes2.error) {
				return reply.code(422).send(dbRes2);
			}
			await notify.friendAcceptedRequest(senderId, receiverId);
			return reply.code(201).send({});

		} catch (e) {
			return reply.code(400).send({ message: "Invalid request" })
		}
	})

	/**
	 * Rejects incoming friend request
	 */
	fastify.post<{
		Body: {
			userId: string
		}
	}>("/requests/reject", {
		preHandler: authJwtMiddleware,
		schema: {
			body: {
				type: "object",
				required: ["userId"],
				properties: {
					userId: { type: "string" },
				},
			}
		}
	}, async (request, reply) => {
		const { userId: userIdStr } = request.body;
		const senderId = request.user.id;

		try {
			const receiverId = Number(userIdStr);

			const dbRes = await Database.getInstance().friendRequestsTable.rejectRequest(senderId, receiverId);
			if (dbRes.error) {
				return reply.code(422).send(dbRes);
			}
			return reply.code(201).send({});

		} catch (e) {
			return reply.code(400).send({ message: "Invalid request" })
		}
	})
}