import { processRawData } from "@utils/websocket";
import type { FastifyInstance } from "fastify";
import type { WebSocket } from "@fastify/websocket"
import jwt from "@utils/jwt";

type ClientValue = { socket: WebSocket }
type ClientMap = Map<number, ClientValue>

const clients: ClientMap = new Map<number, ClientValue>()

export const websocketHandler = async (fastifyInstance: FastifyInstance) => {
	fastifyInstance.get<{ 
		Querystring: {
			accessToken?: string;
		}
	 }>('/ws' ,{ websocket: true }, (socket, req) => {
		const accessToken = req.query.accessToken
		if (!accessToken || !jwt.verify(accessToken)) {
			socket.close(4001, "Invalid or missing credentials!")
			return;
		}
		const userId = jwt.decode(accessToken)!.payload.sub;

		fastifyInstance.log.info(`Client connected: ${userId}`);
		clients.set(userId, { socket })

		socket.on('message', (rawMessage) => {
			try {
				const message = processRawData(rawMessage);
				/*console.log("message: ", message);*/
				if (message === "ping") {
					socket.send("pong");
				}
			} catch (error) {
				console.error(error);
			}
		});

		// Handle client disconnect
		socket.on('close', () => {
			fastifyInstance.log.info(`Client disconnected: ${userId}`);
			/*clients.delete(userId);*/
		});

		socket.on('error', (error) => {
			fastifyInstance.log.error(`WebSocket error with client ${userId}:`, error);
		});
	});
}