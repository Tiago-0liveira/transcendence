import { isSocketValidMessage, notify, processRawData, updateDisconnectedClient } from "@utils/websocket";
import type { FastifyInstance } from "fastify";
import jwt from "@utils/jwt";

export const connectedSocketClients: ClientMap = new Map()

export const websocketHandler = async (fastifyInstance: FastifyInstance) => {
	fastifyInstance.get<{
		Querystring: {
			accessToken?: string;
		}
	}>('/ws', { websocket: true }, async (socket, req) => {
		const accessToken = req.query.accessToken
		if (!accessToken || !jwt.verify(accessToken)) {
			socket.close(4001, "Invalid or missing credentials!")
			return;
		}
		const decodedUser = jwt.decode<AccessTokenPayload>(accessToken);
		if (!decodedUser) {
			socket.close(4001, "Invalid or missing credentials!")
			return;
		}
		const userId = decodedUser.payload.sub;
		const deviceId = decodedUser.payload.deviceId;

		fastifyInstance.log.info(`Client connected: ${userId}::${deviceId}`);
		updateDisconnectedClient(userId, socket);
		await notify.friendsOnline(userId);

		socket.on('message', (rawMessage) => {
			try {
				const message = processRawData(rawMessage);
				/*console.log("message: ", message);*/
				if (message === "ping") {
					socket.send("pong");
					return;
				}
				const parsedMessage = JSON.parse(message);
				console.log("parsedMessaged: ", parsedMessage);
				if (isSocketValidMessage(parsedMessage)) {
					switch (parsedMessage.type) {
						default:
							break;
					}
				} else {
					console.error("INVALID SOCKET MESSAGE!!!")
				}
			} catch (error) {
				console.error(error);
			}
		});

		// Handle client disconnect
		socket.on('close', () => {
			fastifyInstance.log.info(`Client disconnected: ${userId}`);
			connectedSocketClients.delete(userId);
		});

		socket.on('error', (error) => {
			fastifyInstance.log.error(`WebSocket error with client ${userId}:`, error);
		});
	});
}