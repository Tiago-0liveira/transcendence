import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { authJwtMiddleware } from "@middleware/auth";
import Database from "@db/Database";
import jwt from "@utils/jwt";
import { JWT_REFRESH_SECRET } from "@config";
import DEFAULTS from "@utils/defaults";

export default async function jwtRoutes(fastify: FastifyInstance) {
	fastify.get("/refresh", async (request, reply) => {
		if (!request.cookies || !request.cookies.refreshToken) {
			return reply.code(401).send({ message: "Unauthorized" });
		}
		const CookieRefreshToken = request.cookies.refreshToken;
		try {
			const verified = jwt.verify(CookieRefreshToken, JWT_REFRESH_SECRET);
			if (!verified) return reply.code(401).send({ message: "Unauthorized" });
			const dbRes = await Database.getInstance().jwtBlackListTokensTable.exists(CookieRefreshToken);
			if (dbRes.error) {
				console.info("Error in jwtBlackListTokensTable.exists::", dbRes.error);
				return reply.code(500).send({ message: dbRes.error });
			}

			const decoded = jwt.decode(CookieRefreshToken);
			if (!decoded || !decoded.payload || !decoded.payload.sub) {
				return reply.code(400).send({ message: "Invalid Token" });
			}
			const dbUser = await Database.getInstance().userTable.getById(decoded.payload.sub)
			if (dbUser.error) {
				console.info("Error in userTable.getById::", dbUser.error);
				return reply.code(500).send({ message: dbUser.error })
			}
			if (!dbUser.result) {
				return reply.code(404).send({ message: "The user does not exist anymore! " });
			}

			const accessToken = jwt.sign({}, DEFAULTS.jwt.accessToken.options(decoded?.payload.sub))
			const refreshToken = jwt.sign({}, DEFAULTS.jwt.refreshToken.options(decoded?.payload.sub), JWT_REFRESH_SECRET)

			return reply
				.code(200)
				.setCookie("refreshToken", refreshToken, DEFAULTS.cookies.refreshToken.options())
				.header('Access-Control-Allow-Credentials', 'true')
				.send({ accessToken: accessToken });

		} catch (error) {
			console.info("Error in jwtRoutes::refresh::", error);
			return reply.code(401).send({ message: "Unauthorized" });
		}
	})

	fastify.get("/refresh/logout", { preHandler: authJwtMiddleware }, async (request, reply) => {
		reply
			.code(200)
			.clearCookie("refreshToken", DEFAULTS.cookies.refreshToken.clearOptions())
			.send({ ok: true });
	})

	fastify.get("/me", { preHandler: authJwtMiddleware }, async (request, reply) => {
		const user = await Database.getInstance().userTable.getById(request.user.id);
		if (user.error) {
			console.warn("database error: userTable.getById::", user.error)
			return reply.code(500).send({ message: "Internal Database error" });
		}
		if (!user.result) {
			console.warn("/user/me user.result is null: request.user::", request.user);
			return reply.code(404).send({ message: "User is null, probably the user does not exist anymore!" });
		}
		return reply.code(200).send({ user: user.result });
	})

	fastify.get<{
		Querystring: {
			page?: number;
			limit?: number;
		};
	}>("/friends/me", { preHandler: authJwtMiddleware }, async (request, reply) => {
		const { page = 1, limit = 50 } = request.query;
		const offset = (page - 1) * limit;
		const userId = Number(request.user.id as string);

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
	}>("/friends/requests", { preHandler: authJwtMiddleware }, async (request, reply) => {
		const { page = 1, limit = 50 } = request.query;
		const offset = (page - 1) * limit;
		const userId = Number(request.user.id as string);

		const friendsRes = await Database.getInstance().friendRequestsTable.getFriendRequestsWithInfo(userId, offset, limit)
		if (friendsRes.error) {
			return reply.code(500).send(friendsRes);
		}

		return reply.code(200).send({ requests: friendsRes.result });
	})

	fastify.post<{
		Body: {
			userId: string
		};
	}>("/friends/requests/pending/cancel", {
		preHandler: authJwtMiddleware,
		schema: {}
	}, async (request, reply) => {
		const { userId: userIdStr } = request.body;
		const loggedInId = request.user.id as string;

		try {
			const friendId = Number(userIdStr);
			const userId = Number(loggedInId);

			const dbRes = await Database.getInstance().friendRequestsTable.delete(userId, friendId);
			if (dbRes.error) {
				return reply.code(422).send(dbRes);
			}
		} catch (e) {
			return reply.code(400).send({ message: "Invalid userId" })
		}

		return reply.code(200).send({});
	})

	fastify.post<{
		Body: {
			userId: string
		}
	}>("/friends/requests/accept", {
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
		const loggedInId = request.user.id as string;

		try {
			const receiverId = Number(userIdStr);
			const senderId = Number(loggedInId);

			const dbRes = await Database.getInstance().friendRequestsTable.acceptRequest(senderId, receiverId);
			if (dbRes.error) {
				return reply.code(422).send(dbRes);
			}
			const dbRes2 = await Database.getInstance().friendsTable.new({ userId: senderId, friendId: receiverId });
			if (dbRes2.error) {
				return reply.code(422).send(dbRes2);
			}
			return reply.code(201).send({});

		} catch (e) {
			return reply.code(400).send({ message: "Invalid request" })
		}
	})

	fastify.post<{
		Body: {
			userId: string
		}
	}>("/friends/requests/reject", {
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
		const loggedInId = request.user.id as string;

		try {
			const receiverId = Number(userIdStr);
			const senderId = Number(loggedInId);

			const dbRes = await Database.getInstance().friendRequestsTable.rejectRequest(senderId, receiverId);
			if (dbRes.error) {
				return reply.code(422).send(dbRes);
			}
			return reply.code(201).send({});

		} catch (e) {
			return reply.code(400).send({ message: "Invalid request" })
		}
	})

	fastify.post<{
		Body: {
			userId: string
		};
	}>("/friends/add", {
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
		const loggedInId = request.user.id as string;

		try {
			const receiverId = Number(userIdStr);
			const senderId = Number(loggedInId);

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
			return reply.code(201).send({})
		} catch (e) {
			return reply.code(400).send({ message: "Invalid userId" })
		}
	})

	fastify.post<{
		Body: {
			userId: string
		};
	}>("/friends/remove", {
		preHandler: authJwtMiddleware,
		schema: {}
	}, async (request, reply) => {
		const { userId: userIdStr } = request.body;
		const loggedInId = request.user.id as string;

		try {
			const friendId = Number(userIdStr);
			const userId = Number(loggedInId);

			const dbRes = await Database.getInstance().friendsTable.delete(userId, friendId);
			if (dbRes.error) {
				return reply.code(422).send(dbRes);
			}
		} catch (e) {
			return reply.code(400).send({ message: "Invalid userId" })
		}

		return reply.code(200).send({});
	})

	fastify.get<{
		Querystring: {
			name: string,
			page?: number;
			limit?: number;
		};
	}>("/users", {
		preHandler: authJwtMiddleware
	}, async (request, reply) => {
		const userId = Number(request.user.id as string);
		let { name, page = 1, limit = 50 } = request.query;
		let offset = (page - 1) * limit;
		name = name.trim();

		if (!name) {
			return reply.code(400).send({ message: "Invalid name query" })
		}

		const dbRes = await Database.getInstance().friendsTable.getPossibleFriends(userId, name, offset, limit)
		if (dbRes.error) {
			return reply.code(500).send(dbRes)
		}

		return reply.code(200).send({ users: dbRes.result })
	})
}