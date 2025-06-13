import type {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import { authJwtMiddleware } from "@middleware/auth";
import Database from "@db/Database";
import { CookieName } from "@enums/auth";
import DEFAULTS from "@utils/defaults";
import {changePasswordSchema, updateSchema} from "@utils/userSchemas";
import {z} from "zod";

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

    /**
     * Updating curren user
     */
    fastify.post("/update", { preHandler: authJwtMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = request.user.id;
            const parsed = updateSchema.parse(request.body);
            const { displayName, avatarUrl } = parsed;

            const db = Database.getInstance();
            const user = await db.userTable.findById(userId);
            if (!user) {
                return reply.status(404).send({
                    error: "User not found",
                    ok: false,
                });
            }

            // check for new displayname
            let finalDisplayName: string | null = null;
            if (displayName && displayName.trim() !== "" && displayName.trim() !== user.displayName) {
                const taken = await db.userTable.existsDisplayName(displayName.trim());
                if (taken) {
                    return reply.status(400).send({
                        error: "Display name already in use",
                        ok: false,
                    });
                }
                finalDisplayName = displayName.trim();
            }

            // check for new avatar url
            let finalAvatarUrl: string | null = null;
            if (avatarUrl !== null && avatarUrl.trim() !== "" && avatarUrl.trim() !== user.avatarUrl) {
                finalAvatarUrl = avatarUrl.trim();
            }

            // nothing for update
            if (!finalDisplayName && !finalAvatarUrl) {
                return reply.send({ ok: true });
            }

            await db.userTable.updateDisplayNameAndAvatarById(userId, finalDisplayName, finalAvatarUrl);

            return reply.status(200).send({
                message: "Successful",
                ok: true,
            });

        } catch (error) {
            if (error instanceof z.ZodError) {
                fastify.log.warn({
                    type: "ValidationError",
                    issues: error.flatten().fieldErrors,
                }, "Validation failed in /settings/update");

                return reply.status(400).send({
                    message: 'Validation error',
                    errors: error.flatten().fieldErrors,
                    ok: false,
                });
            }

            if (error instanceof Error) {
                fastify.log.warn({
                    type: "ApplicationError",
                    error: error.message,
                    stack: error.stack,
                });

                return reply.status(409).send({
                    error: error.message,
                    ok: false,
                });
            }

            fastify.log.error({
                type: "UnknownError",
                error,
            }, "Unexpected server error");

            return reply.status(500).send({
                error: 'Unexpected server error',
                ok: false,
            });
        }
    });

    /**
     * Updating curren user password
     */
    fastify.post("/password", { preHandler: authJwtMiddleware }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const parsed = changePasswordSchema.parse(request.body);
            const { oldPassword, newPassword } = parsed;

            const db = Database.getInstance();
            const result = await db.userTable.updatePassword(userId, oldPassword, newPassword);

            if ("error" in result) {
                fastify.log.warn({
                    type: "DatabaseError",
                    message: result.error.message,
                    stack: result.error.stack,
                }, "Password update failed");

                const message = result.error.message;
                const status = /not found/i.test(message) ? 404 : 400;

                return reply.status(status).send({
                    ok: false,
                    error: message,
                });
            }

            return reply.status(200).send({
                ok: true,
                message: "Password updated successfully",
            });

        } catch (error) {
            if (error instanceof z.ZodError) {
                fastify.log.warn({
                    type: "ValidationError",
                    issues: error.flatten().fieldErrors,
                }, "Validation failed in /settings/password");

                return reply.status(400).send({
                    ok: false,
                    message: "Validation error",
                    errors: error.flatten().fieldErrors,
                });
            }

            fastify.log.error({
                type: "UnexpectedError",
                err: error instanceof Error ? error.message : error,
            }, "Unhandled error in /settings/password");

            return reply.status(500).send({
                ok: false,
                message: "Unexpected server error",
            });
        }
    });
}
