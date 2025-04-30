import Fastify from "fastify";
import cors from "@fastify/cors"
import fastifyCookie from "@fastify/cookie"
import { PORT, FRONTEND_URL, JWT_SECRET } from "@config"
import registerRoutes from "./routes";

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

registerRoutes(app);

app.setNotFoundHandler((req, reply) => {
	reply.code(404).send({ message: "Endpoint not found!" })
});

app.ready().then(() => {
	console.log(app.printRoutes());
});

app.listen({ port: PORT, host: "0.0.0.0" }, (err, addr) => {
	if (err) {
		app.log.error(err);
		process.exit(1);
	}
	console.log(`🚀 Fastify running at ${addr}`);
});
