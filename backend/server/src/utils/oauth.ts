import { OAuth2Client, TokenPayload } from 'google-auth-library';
import {FastifyReply, FastifySchema, FastifyTypeProviderDefault} from 'fastify';
import {ResolveRequestBody} from "fastify/types/type-provider";

export async function getGooglePayload(
    code: ResolveRequestBody<FastifyTypeProviderDefault, FastifySchema, { Body: { code: string } }>,
    googleClient: OAuth2Client | null,
    reply: FastifyReply
): Promise<TokenPayload | null> {
    if (!googleClient) {
        reply.code(400).send({
            error: "Google OAuth is not enabled!",
            ok: false
        });
        return null;
    }

    const { tokens } = await googleClient.getToken(code);

    if (!tokens || !tokens.id_token) {
        reply.code(500).send({
            error: "GoogleClient could not get the token for the given code!",
            ok: false
        });
        return null;
    }

    const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID!,
    });
    const payload = ticket.getPayload();

    if (!payload) {
        reply.code(500).send({
            error: "Could not get user info payload!",
            ok: false
        });
        return null;
    }

    return payload;
}