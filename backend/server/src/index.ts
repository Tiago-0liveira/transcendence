import Fastify from "fastify";
import cors from "@fastify/cors"
import fastifyCookie from "@fastify/cookie"
import fastifyWebsocket from "@fastify/websocket";
import { PORT, FRONTEND_URL, JWT_SECRET } from "@config"
import registerRoutes from "./routes";
import Database from "@db/Database";
import fs from "fs"


Database.getInstance()/* Force db creation */

const fastifyOptions = {
	logger: true, // Enable Fastify logger if needed
	https: {
		key: fs.readFileSync('/etc/certs/selfsigned.key'),
		cert: fs.readFileSync('/etc/certs/selfsigned.crt'),
		maxVersion: 'TLSv1.3'
	}
};

const app = Fastify(fastifyOptions);

app.register(fastifyCookie, {
	secret: JWT_SECRET,
	hook: "onRequest",
	parseOptions: {}
})

app.register(cors, {
	origin: (origin, callback) => {
		const allowedOrigins = [
			FRONTEND_URL,
			/^https:\/\/10\.12\.\d{1,3}\.\d{1,3}(:\d+)?$/ // Regex to match 10.12.x.x
		];
		if (!origin) {
			// Allow non-browser tools like curl/postman
			return callback(null, true);
		}

		const isAllowed = allowedOrigins.some(o =>
			typeof o === 'string' ? o === origin : o.test(origin)
		);

		callback(null, isAllowed);
	},
	methods: ['GET', 'POST', 'DELETE', 'PUT'],
	allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Accept'],
	credentials: true,
	optionsSuccessStatus: 200
});
app.register(fastifyWebsocket)

registerRoutes(app);

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
