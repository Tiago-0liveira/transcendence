import { FastifyInstance } from "fastify";
import { authJwtMiddleware } from "@middleware/auth";
import Database from "@db/Database";

export default async function UserProfileRoutes(fastify: FastifyInstance) {
    // === /stats (текущий пользователь) ===
    fastify.get("/profile", { preHandler: authJwtMiddleware }, async (request, reply) => {
        return getProfileHandler(request.user.id, fastify, reply);
    });

    // === /stats/:userId (любой пользователь) ===
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

// ===== Универсальный хендлер для обоих случаев =====
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

        // Новый блок — получаем имя и аватар юзера
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

        // ⬅️ Добавляем имя и аватар прямо в stats
        return reply.status(200).send({
            ok: true,
            result: {
                stats: {
                    ...statsResult.result,
                    displayName,
                    avatarUrl
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
