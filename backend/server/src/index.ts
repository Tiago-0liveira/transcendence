import Fastify from "fastify";

const app = Fastify({ logger: true });

app.get("/", async () => {
	return { message: "Index" }
})

// Serve API route
app.get("/api/hello", async () => {
	return { message: "Hello from Fastify API!" };
});

/*// Catch-all to serve SPA index.html
app.setNotFoundHandler((req, reply) => {
	reply.sendFile("index.html");
});
*/
// Start Fastify
const PORT = 3000;
app.listen({ port: PORT, host: "0.0.0.0" }, () => {
	console.log(`🚀 Fastify running at http://localhost:${PORT}`);
});
