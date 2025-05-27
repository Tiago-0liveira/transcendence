import { isSocketValidMessage, notify, processRawData, updateDisconnectedClient } from "@utils/websocket";
import type { FastifyInstance } from "fastify";
import jwt from "@utils/jwt";
import { handleDeleteGameRoom, handleGameRoomGetData, handleNewGameConfig } from "@game/game-config";
import { handleJoinRooms, updateRooms } from "@game/game-room";

export const connectedSocketClients: ClientMap = new Map()
export const activeGameRooms: GameRooms = new Map()

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
		const clientContext: ClientThis = { userId, deviceId, socket }

		fastifyInstance.log.info(`Client connected: ${userId}::${deviceId}`);
		updateDisconnectedClient(userId, socket);
		await notify.friendsOnline(userId);

		socket.on('message', async (rawMessage) => {
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
						case "new-game-config":
							await handleNewGameConfig(clientContext, parsedMessage);
							await handleJoinRooms();
							break;
						case "game-room-join-request":
							await handleGameRoomGetData(clientContext, parsedMessage);
							await handleJoinRooms();
							break;
						case "join-rooms":
							await updateRooms(clientContext.socket, clientContext.userId)
							break;
						case "leave-game-lobby":
							const room = activeGameRooms.get(parsedMessage.roomId)
							if (room) {

								room.playerLeft(clientContext.userId)
								await handleJoinRooms();
							}
							break;
						case "delete-game-room":
							if (await handleDeleteGameRoom(clientContext, parsedMessage)) {
								fastifyInstance.log.info(`Game room deleted: ${parsedMessage.roomId}`);
								await handleJoinRooms();
							}
							break;
						default:
							console.log("unkown message")
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
			for (const [id, room] of activeGameRooms) {
				room.playerLeft(clientContext.userId)
			}
			handleJoinRooms();
		});

		socket.on('error', (error) => {
			fastifyInstance.log.error(`WebSocket error with client ${userId}:`, error);
		});
	});
}