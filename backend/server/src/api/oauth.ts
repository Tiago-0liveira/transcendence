import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { authJwtMiddleware } from "@middleware/auth";
import Database from "@db/Database";
import jwt from "@utils/jwt";
import { JWT_REFRESH_SECRET, GOOGLE_AUTH_ENABLED, GOOGLE_CLIENT_SECRET, FRONTEND_URL, GOOGLE_CLIENT_ID } from "@config";
import { OAuth2Client } from "google-auth-library";
import { UserAuthMethod } from "@enums/enums";
import DEFAULTS from "@utils/defaults";
import { googleOauthMiddleware, oauthJwtMiddleware } from "@middleware/google";
import { RequestPostGoogleSignUpComplete, RequestWithGoogleOauthPayload } from "@types/requests";

export let googleClient: OAuth2Client | null = null;
if (GOOGLE_AUTH_ENABLED) {
	googleClient = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FRONTEND_URL);
}

export default async function oauthRoutes(fastify: FastifyInstance) {
	fastify.post("/login/google", {
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
	}, async (request: FastifyRequest<{Body: {code: string}}>, reply) => {
		try {
			if (!googleClient) {
				return reply.code(400).send({error: "Google Oauth is not enabled!"})
			}
			const { code } = request.body;
		
			const { tokens } = await googleClient.getToken(code);
			
			if (!tokens || !tokens.id_token) {
				return reply.code(500).send({error: "GoogleClient could not get the token for the given code!"})
			}
			const userInfo = await googleClient.verifyIdToken({
				idToken: tokens.id_token,
				audience: GOOGLE_CLIENT_ID
			});
		
			const payload = userInfo.getPayload();
			if (!payload) {
				return reply.code(500).send({ error: "Could not get user info payload!" })
			}

			const res = await Database.getInstance().userTable.existsGoogleId(payload.sub)
			if (!res) {
				return reply.code(400).send({ message: "User does not exist!" });
			}
		
			const accessToken = jwt.sign({}, DEFAULTS.jwt.accessToken.options(res.id))
			const refreshToken = jwt.sign({}, DEFAULTS.jwt.accessToken.options(res.id), JWT_REFRESH_SECRET)

			reply
				.code(200)
				.setCookie("refreshToken", refreshToken, DEFAULTS.cookies.refreshToken.options())
				.header('Access-Control-Allow-Credentials', 'true')
				.send({ accessToken: accessToken });
		} catch (error) {
			console.error("Error exchanging code:", error);
			reply.status(500).send({ error: "Failed to exchange code" });
		}
	})

	fastify.post("/signup/google", {
		preHandler: [googleOauthMiddleware],
	},	async (request: FastifyRequest<{Body: {code: string}}>, reply) => {
		try {
			if (!googleClient) {
				return reply.code(400).send({ error: "Google Oauth is not enabled!" })
			}
			const { code } = request.body;
		
			const { tokens } = await googleClient.getToken(code);
			
			if (!tokens || !tokens.id_token) {
				return reply.code(500).send({error: "GoogleClient could not get the token for the given code!"})
			}
			const userInfo = await googleClient.verifyIdToken({
				idToken: tokens.id_token,
				audience: GOOGLE_CLIENT_ID
			});
		
			const payload = userInfo.getPayload();
			if (!payload) {
				return reply.code(500).send({ error: "Could not get user info payload!" })
			}

			const user = {
				googleId: payload.sub,
				name: payload.name,
				email: payload.email,
				avatar: payload.picture,
			};

			if (await Database.getInstance().userTable.existsGoogleId(user.googleId)) {
				return reply.code(401).send({ error: "User already exists! Try logging in with google" });
			}

			const token = jwt.sign(user, DEFAULTS.jwt.oauthToken.options(user.googleId))

			reply
				.setCookie("oauthGoogleToken", token, DEFAULTS.cookies.oauthToken.options())
				.send({})
		}	catch (error) {
			console.error("Error exchanging code:", error);
			reply.status(500).send({ error: "Failed to exchange code" });
		}
	})

	fastify.post("/signup/google/complete",  {
		preHandler: [googleOauthMiddleware, oauthJwtMiddleware],
	},	async (request: RequestPostGoogleSignUpComplete, reply) => {

		try {
			const { user } = request.body;
			const googlePayload = request.googlePayload;
			const db = Database.getInstance()

			// TODO: validate input (payload)
			const newUserData: UserParams = {
				username: user.username,
				displayName: user.displayName || user.username,
				avatarUrl: user.avatarUrl || googlePayload.avatar,
				authProvider: UserAuthMethod.GOOGLE,
				authProviderId: googlePayload.googleId,
				password: "",
			};

			console.log("newUserData:", newUserData)

			const newDbUser = await db.userTable.new(newUserData);
			if (newDbUser.error) {
				return reply.status(400).send({ error: newDbUser.error })
			}

			const accessToken = jwt.sign({}, DEFAULTS.jwt.accessToken.options(String(newDbUser.result)))
			const refreshToken = jwt.sign({}, DEFAULTS.jwt.refreshToken.options(String(newDbUser.result)), JWT_REFRESH_SECRET)

			reply
				.code(200)
				.setCookie("refreshToken", refreshToken, DEFAULTS.cookies.oauthToken.options())
				.header('Access-Control-Allow-Credentials', 'true')
				.send({ accessToken: accessToken, user: newDbUser.result });

		} catch (error) {
			console.error("Error: ", error);
			reply.status(500).send({ error })
		}
	})
}