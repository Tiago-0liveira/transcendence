import Fastify from "fastify";
import cors from "@fastify/cors"
import fastifyCookie from "@fastify/cookie"
import { PORT, DEV_MODE, FRONTEND_URL, JWT_SECRET } from "@config"
import Database from "@db/Database";

import userRoutes from "./api/user";
import jwtRoutes from "./api/jwt"
import oauthRoutes from "./api/oauth";

const db = Database.getInstance();
const app = Fastify({ logger: true });

app.register(fastifyCookie, {
	secret: JWT_SECRET,
	hook: "onRequest",
	parseOptions: {}
})

app.register(cors, {
	origin: [FRONTEND_URL],
	methods: ["GET", "POST", "DELETE", "PUT"],
	allowedHeaders: ["Content-Type", "Authorization", "Cookie", "Accept"],
	credentials: true,
	optionsSuccessStatus: 200
})

app.register(userRoutes, { prefix: "/user" })
app.register(jwtRoutes, { prefix: "/auth" })
app.register(oauthRoutes, { prefix: "/oauth" })

app.setNotFoundHandler((req, reply) => {
	reply.code(404).send({ message: "Endpoint not found!" })
});

app.listen({ port: PORT, host: "0.0.0.0" }, (err, addr) => {
	if (err) {
		app.log.error(err);
		process.exit(1);
	}
	console.log(`🚀 Fastify running at ${addr}`);
});
