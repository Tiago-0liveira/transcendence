import type { FastifyInstance, FastifyRequest } from "fastify";
import Database from "@db/Database";
import jwt from "@utils/jwt";
import { JWT_REFRESH_SECRET, GOOGLE_HAS_CREDENTIALS, GOOGLE_CLIENT_SECRET, FRONTEND_URL, GOOGLE_CLIENT_ID } from "@config";
import { OAuth2Client } from "google-auth-library";
import { UserAuthMethod } from "@enums/enums";
import DEFAULTS from "@utils/defaults";
import { googleOauthMiddleware, oauthJwtMiddleware } from "@middleware/google";
import { CookieName } from "@enums/auth";

export let googleClient: OAuth2Client | null = null;
if (GOOGLE_HAS_CREDENTIALS) {
	googleClient = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FRONTEND_URL);
}

/** 
 * path: /oauth/google/
*/
export default async function oauthGoogleRoutes(fastify: FastifyInstance) {

	/**
	 * Google login
	 */
	fastify.post("/login", {
		preHandler: [googleOauthMiddleware],
		schema: {
			body: {
				type: "object",
				required: ["code"],
				properties: {
					code: { type: "string" },
				},
			},
		}
	}, async (request: FastifyRequest<{ Body: { code: string } }>, reply) => {
		try {
			if (!googleClient) {
				return reply.code(400).send({ error: "Google Oauth is not enabled!" })
			}
			const { code } = request.body;

			const { tokens } = await googleClient.getToken(code);

			if (!tokens || !tokens.id_token) {
				return reply.code(500).send({ error: "GoogleClient could not get the token for the given code!" })
			}
			const userInfo = await googleClient.verifyIdToken({
				idToken: tokens.id_token,
				audience: GOOGLE_CLIENT_ID
			});

			const payload = userInfo.getPayload();
			if (!payload) {
				return reply.code(500).send({ error: "Could not get user info payload!" })
			}

			const res = await Database.getInstance().userTable.existsGoogleId(Number(payload.sub))
			if (!res) {
				return reply.code(400).send({ message: "User does not exist!" });
			}

			const accessToken = jwt.sign({}, DEFAULTS.jwt.accessToken.options(res.id))
			const refreshToken = jwt.sign({}, DEFAULTS.jwt.refreshToken.options(res.id), JWT_REFRESH_SECRET)

			reply
				.code(200)
				.setCookie(CookieName.REFRESH_TOKEN, refreshToken, DEFAULTS.cookies.refreshToken.options())
				.header('Access-Control-Allow-Credentials', 'true')
				.send({ accessToken: accessToken });
		} catch (error) {
			console.error("Error exchanging code:", error);
			reply.status(500).send({ error: "Failed to exchange code" });
		}
	})

	/**
	 * Google SignUp first handshake (sets `CookieName.OAUTH_GOOGLE_TOKEN` for completing the signup)
	 */
	fastify.post("/signup", {
		preHandler: [googleOauthMiddleware],
		schema: {
			body: {
				type: "object",
				required: ["code"],
				properties: {
					code: { type: "string" },
				},
			},
		}
	}, async (request: FastifyRequest<{ Body: { code: string } }>, reply) => {
		try {
			if (!googleClient) {
				return reply.code(400).send({ error: "Google Oauth is not enabled!" })
			}
			const { code } = request.body;

			const { tokens } = await googleClient.getToken(code);

			if (!tokens || !tokens.id_token) {
				return reply.code(500).send({ error: "GoogleClient could not get the token for the given code!" })
			}
			const userInfo = await googleClient.verifyIdToken({
				idToken: tokens.id_token,
				audience: GOOGLE_CLIENT_ID
			});

			const payload = userInfo.getPayload();
			if (!payload) {
				return reply.code(500).send({ error: "Could not get user info payload!" })
			}

			const user: RequestGooglePayload = {
				googleId: Number(payload.sub),
				name: payload.name as string,
				avatar: payload.picture as string,
			};

			if (await Database.getInstance().userTable.existsGoogleId(user.googleId)) {
				return reply.code(401).send({ error: "User already exists! Try logging in with google" });
			}

			const token = jwt.sign(user, DEFAULTS.jwt.oauthToken.options(user.googleId))

			reply
				.setCookie(CookieName.OAUTH_GOOGLE_TOKEN, token, DEFAULTS.cookies.oauthToken.options())
				.send({})
		} catch (error) {
			console.error("Error exchanging code:", error);
			reply.status(500).send({ error: "Failed to exchange code" });
		}
	})

	fastify.post("/signup/complete", {
		preHandler: [googleOauthMiddleware, oauthJwtMiddleware],
		schema: {
			body: {
				type: "object",
				required: ["username"],
				properties: {
					username: { type: "string" },
					displayName: { type: "string", nullable: true },
					avatarUrl: { type: "string", format: "uri", nullable: true }
				},
			},
		}
	}, async (request: FastifyRequest<{Body: GoogleSignUpCompletePayload}>, reply) => {

		try {
			const googlePayload = request.googlePayload;
			const db = Database.getInstance()

			// TODO: validate input (payload)
			const newUserData: UserParams = {
				username: request.body.username,
				displayName: request.body.displayName || request.body.username,
				avatarUrl: request.body.avatarUrl || googlePayload.avatar,
				authProvider: UserAuthMethod.GOOGLE,
				authProviderId: googlePayload.googleId,
				password: "",
			};

			const newDbUser = await db.userTable.new(newUserData);
			if (newDbUser.error) {
				return reply.status(400).send({ error: newDbUser.error })
			}

			const accessToken = jwt.sign({}, DEFAULTS.jwt.accessToken.options(newDbUser.result))
			const refreshToken = jwt.sign({}, DEFAULTS.jwt.refreshToken.options(newDbUser.result), JWT_REFRESH_SECRET)

			reply
				.code(200)
				.clearCookie(CookieName.OAUTH_GOOGLE_TOKEN, DEFAULTS.cookies.oauthToken.clearOptions())
				.setCookie(CookieName.REFRESH_TOKEN, refreshToken, DEFAULTS.cookies.refreshToken.options())
				.header('Access-Control-Allow-Credentials', 'true')
				.send({ accessToken: accessToken, user: newDbUser.result });

		} catch (error) {
			console.error("Error: ", error);
			reply.status(500).send({ error })
		}
	})
}