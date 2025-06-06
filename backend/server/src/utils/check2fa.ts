import speakeasy from "speakeasy";
import Database from "@db/Database";

export async function check2FA(userId: number, token?: string): Promise<void> {
    const db = Database.getInstance();
    const entry = await db.user2FATable.getByUserId(userId);

    if (entry.error) {
        throw new Error("Database error while checking 2FA");
    }

    if (!entry.result?.enabled) return; // 2FA not enabled — pass

    if (!token) {
        const err: any = new Error("2FA_REQUIRED");
        err.status = 403;
        throw err;
    }

    const verified = speakeasy.totp.verify({
        secret: entry.result.secret,
        encoding: "base32",
        token,
        window: 1
    });

    if (!verified) {
        const err: any = new Error("Invalid 2FA code");
        err.status = 403;
        throw err;
    }
}
