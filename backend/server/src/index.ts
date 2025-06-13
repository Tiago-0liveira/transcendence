import Fastify from "fastify";
import cors from "@fastify/cors"
import fastifyCookie from "@fastify/cookie"
import fastifyWebsocket from "@fastify/websocket";
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
	origin: (origin, callback) => {
	  const allowedOrigins = [
		'http://localhost:3000',
		/^http:\/\/10\.12\.\d{1,3}\.\d{1,3}(:\d+)?$/ // Regex to match 10.12.x.x
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
