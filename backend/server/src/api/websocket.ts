import { authJwtMiddleware } from "@middleware/auth";
import { processRawData } from "@utils/websocket";
import type { FastifyInstance } from "fastify";
import { v4 as uuidv4 } from "uuid"


export const websocketHandler = async (fastifyInstance: FastifyInstance) => {
	fastifyInstance.get('/ws' ,{ websocket: true }, (socket, req) => {

		const clientId = uuidv4();
		fastifyInstance.log.info(`Client connected: ${clientId}`);

		socket.on('message', (rawMessage) => {
			/*fastifyInstance.log.info(`Message from ${clientId}: ${rawMessage}`);*/
			
			try {
				const message = processRawData(rawMessage);
				console.log("message: ", message);
				if (message === "ping") {
					socket.send("pong");
				}
			} catch (error) {
				console.error(error);
			}
		});

		// Handle client disconnect
		socket.on('close', () => {
			fastifyInstance.log.info(`Client disconnected: ${clientId}`);
			/*clients.delete(clientId);*/
		});

		socket.on('error', (error) => {
			fastifyInstance.log.error(`WebSocket error with client ${clientId}:`, error);
		});
	});
}