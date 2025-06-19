import { FastifyInstance } from "fastify";
import { authJwtMiddleware } from "@middleware/auth";
import Database from "@db/Database";
import {connectedSocketClients} from "@api/websocket";

export default async function UserProfileRoutes(fastify: FastifyInstance) {
    // === /profile (current user) ===
    fastify.get("/profile", { preHandler: authJwtMiddleware }, async (request, reply) => {
        return getProfileHandler(request.user.id, fastify, reply);
    });

    // === /profile/:userId (any user) ===
    fastify.get("/profile/:userId", { preHandler: authJwtMiddleware }, async (request, reply) => {
        const userId = parseInt(request.params.userId, 10);
        if (isNaN(userId)) {
            return reply.status(400).send({
                ok: false,
                message: "Invalid userId"
            });
        }
        return getProfileHandler(userId, fastify, reply);
    });
}

async function getProfileHandler(userId: number, fastify: FastifyInstance, reply: any) {
    try {
        const db = Database.getInstance();

        const statsResult = await db.userStatsTable.getByUserId(userId);
        if (statsResult.error) {
            fastify.log.error({ err: statsResult.error, userId }, "Database error in get user stats");
            return reply.status(404).send({
                ok: false,
                message: `No stats found for userId ${userId}`
            });
        }

        const historyResult = await db.gameHistoryTable.getByUserId(userId);
        if (historyResult.error) {
            fastify.log.error({ err: historyResult.error, userId }, "Database error in get user game history");
            return reply.status(500).send({
                ok: false,
                message: `Failed to load game history for userId ${userId}`
            });
        }

        const userResult = await db.userTable.getById(userId);
        let displayName = "Unknown";
        let avatarUrl = "";
        if ("result" in userResult) {
            displayName = userResult.result.displayName;
            avatarUrl = userResult.result.avatarUrl;
        }

        const history = historyResult.result;
        const uniqueUserIds = [...new Set(history.flatMap(g => [g.winnerId, g.loserId]))];

        const usersMap = new Map<number, { displayName: string; avatarUrl: string }>();
        for (const id of uniqueUserIds) {
            const user = await db.userTable.getById(id);
            if ("result" in user) {
                const { displayName, avatarUrl } = user.result;
                usersMap.set(id, { displayName, avatarUrl });
            } else {
                usersMap.set(id, { displayName: "Unknown", avatarUrl: "" });
            }
        }

        const hydratedHistory = history.map(game => ({
            ...game,
            winner: usersMap.get(game.winnerId),
            loser: usersMap.get(game.loserId)
        }));
        const connected = connectedSocketClients.get(userId)?.connected?? false

        return reply.status(200).send({
            ok: true,
            result: {
                stats: {
                    ...statsResult.result,
                    displayName,
                    avatarUrl,
                    connected
                },
                history: hydratedHistory
            }
        });
    } catch (error) {
        fastify.log.error({ err: error }, "Unhandled error in /stats");
        return reply.status(500).send({
            ok: false,
            message: "Unexpected server error"
        });
    }
}
