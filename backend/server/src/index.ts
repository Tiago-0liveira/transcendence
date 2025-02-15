import Fastify from "fastify";
import { PORT } from "./config"
import Database from "./database/Database";
import userRoutes from "./api/user";

const db = Database.getInstance();
const app = Fastify({ logger: true });

app.register(userRoutes, { prefix: "/user" })

app.get("/", async () => {
	return { message: "112asdasdasda12312312312312321312312sdasdasd3" }
})

/*app.get("/user", async () => {
	return { message: "ola user" };
})
*/
// Serve API route
app.get("/api/hello", async () => {
	return { message: "Hello from Fastify API!" };
});

/*// Catch-all to serve SPA index.html
app.setNotFoundHandler((req, reply) => {
	reply.sendFile("index.html");
});
*/
app.listen({ port: PORT, host: "0.0.0.0" }, () => {
	console.log(`🚀 Fastify running at http://localhost:${PORT}`);
});


console.log("ola")