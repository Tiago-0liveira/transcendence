import Fastify from "fastify";
import cors from "@fastify/cors"
import fastifyCookie from "@fastify/cookie"
import { PORT, FRONTEND_URL, JWT_SECRET, DEV_MODE } from "@config"
import registerRoutes from "./routes";
import Database from "@db/Database";

/*import fs from "fs"
import path from "path"*/

Database.getInstance()/* Force db creation */

const BaseFastifyOptions = {
	logger: true, // Enable Fastify logger if needed
};

// SSL certificates for development mode (HTTPS)
const httpsOptions = DEV_MODE ? {
	/* use this on prod */
	/*https: {
	  key: fs.readFileSync(path.join(__dirname, 'etc/certs/nginx-selfsigned.key')),
	  cert: fs.readFileSync(path.join(__dirname, 'etc/certs/nginx-selfsigned.crt')),
	}*/
} : {};

// Combine base options with HTTPS options if needed
const fastifyOptions = DEV_MODE ? { ...BaseFastifyOptions, ...httpsOptions } : BaseFastifyOptions;

const app = Fastify(fastifyOptions);

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
