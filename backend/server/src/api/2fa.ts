import { FastifyInstance } from "fastify";
import speakeasy from "speakeasy";
import { z } from "zod";
import Database from "@db/Database";

export default async function auth2faRoutes(fastify: FastifyInstance) {
    const db = Database.getInstance();

    // ✅ Ручка включения/отключения 2FA
    const bodySchema = z.object({
        userId: z.number(),
        enabled: z.boolean(),
    });

    fastify.post("/2fa/toggle", async (request, reply) => {
        const parse = bodySchema.safeParse(request.body);
        if (!parse.success) {
            return reply.code(400).send({
                error: "Invalid request body",
                issues: parse.error.issues,
            });
        }

        const { userId, enabled } = parse.data;

        try {
            const userCheck = await db.userTable.getById(userId);
            if (userCheck.error || !userCheck.result) {
                return reply.code(404).send({ error: "User not found" });
            }

            const twofa = await db.user2FATable.getByUserId(userId);
            if (twofa.error || !twofa.result) {
                return reply.code(404).send({ error: "2FA entry not found for this user" });
            }

            if (enabled && twofa.result.enabled) {
                return reply.send({ enabled: true });
            }

            if (enabled) {
                const secret = speakeasy.generateSecret({
                    name: `Transcendence (${userId})`,
                    length: 20,
                });

                await db.user2FATable.update(userId, {
                    userId,
                    enabled: true,
                    secret: secret.base32,
                });

                return reply.send({
                    enabled: true,
                    secret: secret.base32,
                    otpauth_url: secret.otpauth_url,
                });
            } else {
                await db.user2FATable.update(userId, {
                    userId,
                    enabled: false,
                    secret: "",
                });
                return reply.send({ enabled: false });
            }
        } catch (err: any) {
            console.error("2FA toggle error:", err);
            return reply.code(500).send({ error: "Internal server error" });
        }
    });

    // ✅ Ручка проверки кода (2FA verify)
    const verifySchema = z.object({
        userId: z.number(),
        token: z.string().length(6),
    });

    fastify.post("/2fa/verify", async (request, reply) => {
        const parsed = verifySchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.code(400).send({
                error: "Invalid input",
                issues: parsed.error.issues,
            });
        }

        const { userId, token } = parsed.data;

        try {
            const twofa = await db.user2FATable.getByUserId(userId);
            if (!twofa.result || !twofa.result.enabled) {
                return reply.code(400).send({ error: "2FA is not enabled for this user" });
            }

            const verified = speakeasy.totp.verify({
                secret: twofa.result.secret,
                encoding: "base32",
                token,
                window: 1,
            });

            return reply.send({ valid: verified });
        } catch (err: any) {
            console.error("2FA verification error:", err);
            return reply.code(500).send({ error: "Internal server error" });
        }
    });

    fastify.post("/2fa/status", async (request, reply) => {
        const schema = z.object({
            userId: z.number(),
        });
        const parsed = schema.safeParse(request.body);

        if (!parsed.success) {
            return reply.code(400).send({ error: "Invalid input", issues: parsed.error.issues });
        }

        const { userId } = parsed.data;

        try {
            const twofa = await db.user2FATable.getByUserId(userId);
            if (!twofa.result) {
                return reply.send({ enabled: false });
            }
            return reply.send({ enabled: twofa.result.enabled });
        } catch (err) {
            console.error("2FA status check error:", err);
            return reply.code(500).send({ error: "Internal server error" });
        }
    });

}
