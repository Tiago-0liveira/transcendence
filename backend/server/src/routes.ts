import type { FastifyInstance } from "fastify";

import jwtRoutes from "@api/jwt"
import authenticationRoutes from "@api/auth/authentication";
import friendsRoutes from "@api/auth/friends";
import AuthGeneralRoutes from "@api/auth/general";
import oauthGoogleRoutes from "@api/oauth/google";
import { websocketHandler } from "./api/websocket";

/**
 * @description Registers all endpoints necessary for the server (in a organized way)
 * @argument app: FastifyInstance
 */
export default function registerRoutes(app: FastifyInstance) {
	// path: /
	app.register(
		(fastifyInstance, _, done) => {
			fastifyInstance.register(websocketHandler)
			done()
		},
		{ prefix: "/" }
	)
	// path: /auth
	app.register(
		(fastifyInstance, _, done) => {
			fastifyInstance.register(AuthGeneralRoutes)
			fastifyInstance.register(authenticationRoutes)
			fastifyInstance.register(friendsRoutes, { prefix : "/friends" })
			done()
		},
		{ prefix: "/auth" }
	)
	// path: /oauth
	app.register(
		(fastifyInstance, _, done) => {
			fastifyInstance.register(oauthGoogleRoutes, { prefix : "/google" })
			done()
		},
		{ prefix: "/oauth" }
	)
	app.register(jwtRoutes, { prefix: "/jwt" })
}