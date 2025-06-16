import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import BlockedUsersService from "@services/BlockedUsersService";

export default async function blockedUsersRoutes(fastify: FastifyInstance) {

    /**
     * Block a user
     */
    fastify.post("/block", {
        schema: {
            body: {
                type: "object",
                required: ["userId"],
                properties: {
                    userId: { type: "string" }
                }
            }
        }
    }, async (request: FastifyRequest<{ Body: { userId: string } }>, reply: FastifyReply) => {
        try {
            const currentUserId = request.user!.id;
            const userToBlockId = Number(request.body.userId);

            if (isNaN(userToBlockId)) {
                return reply.code(400).send({ error: "Invalid user ID" });
            }

            const blockedUsersService = BlockedUsersService.getInstance();
            const result = await blockedUsersService.blockUser(currentUserId, userToBlockId);

            if (result.error) {
                return reply.code(400).send({ error: result.error.message });
            }

            reply.send({ success: true, message: "User blocked successfully" });
        } catch (error) {
            console.error("Error blocking user:", error);
            reply.code(500).send({ error: "Internal server error" });
        }
    });

    /**
     * Unblock a user
     */
    fastify.post("/unblock", {
        schema: {
            body: {
                type: "object",
                required: ["userId"],
                properties: {
                    userId: { type: "string" }
                }
            }
        }
    }, async (request: FastifyRequest<{ Body: { userId: string } }>, reply: FastifyReply) => {
        try {
            const currentUserId = request.user!.id;
            const userToUnblockId = Number(request.body.userId);

            if (isNaN(userToUnblockId)) {
                return reply.code(400).send({ error: "Invalid user ID" });
            }

            const blockedUsersService = BlockedUsersService.getInstance();
            const result = await blockedUsersService.unblockUser(currentUserId, userToUnblockId);

            if (result.error) {
                return reply.code(400).send({ error: result.error.message });
            }

            reply.send({ success: true, message: "User unblocked successfully" });
        } catch (error) {
            console.error("Error unblocking user:", error);
            reply.code(500).send({ error: "Internal server error" });
        }
    });

    /**
     * Get blocked users list
     */
    fastify.get("/blocked", async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const currentUserId = request.user!.id;
            const blockedUsersService = BlockedUsersService.getInstance();
            const result = await blockedUsersService.getBlockedUsers(currentUserId);

            if (result.error) {
                return reply.code(500).send({ error: result.error.message });
            }

            reply.send({ blockedUsers: result.result });
        } catch (error) {
            console.error("Error getting blocked users:", error);
            reply.code(500).send({ error: "Internal server error" });
        }
    });
}
