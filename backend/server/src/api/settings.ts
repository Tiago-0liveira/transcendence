import type { FastifyInstance } from "fastify";
import { authJwtMiddleware } from "@middleware/auth";
import Database from "@db/Database";
import { CookieName } from "@enums/auth";
import DEFAULTS from "@utils/defaults";

export default async function UserSettingsRoutes(fastify: FastifyInstance) {
    /**
     * Deleting curren user
     */
    fastify.delete("/account", { preHandler: authJwtMiddleware }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const db = Database.getInstance();

            const deleteResult = await db.userTable.delete(userId);

            if (deleteResult.error) {
                fastify.log.error({ err: deleteResult.error, userId }, "Database error in delete");
                return reply.status(500).send({
                    ok: false,
                    message: "Failed to delete user"
                });
            }

            reply
                .clearCookie(CookieName.REFRESH_TOKEN, DEFAULTS.cookies.refreshToken.clearOptions())
                .clearCookie(CookieName.OAUTH_GOOGLE_TOKEN, DEFAULTS.cookies.oauthToken.clearOptions())
                .code(200)
                .send({
                    ok: true,
                    message: "User account deleted and logged out"
                });

        } catch (error) {
            fastify.log.error({ err: error }, "Unhandled error in /user/settings/account");
            return reply.status(500).send({
                ok: false,
                message: "Unexpected server error"
            });
        }
    });
}
