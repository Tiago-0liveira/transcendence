import { isSocketValidMessage, notify, processRawData, updateDisconnectedClient } from "@utils/websocket";
import type { FastifyInstance } from "fastify";
import jwt from "@utils/jwt";
import { handleDeleteGameRoom, handleGameRoomGetData, handleNewGameConfig } from "@game/game-config";
import { handleJoinRooms, lobbyFuncs, sendPlayerUpdatedRooms } from "@game/lobby";
import { handleGamePlayerInput, handleGamePlayerLeave, handleGameRoomJoin, handleGameRoomPlayerSetReady, sendGameRoomUpdate } from "@game/game"

export const connectedSocketClients: ClientMap = new Map()
export const activeGameRooms: GameRooms = new Map()

//TODO: when a user disconnects, we should update the rooms they were in

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
				// TODO: look into this and see where do we need to only update the clients in specific rooms
				if (isSocketValidMessage(parsedMessage)) {
					switch (parsedMessage.type) {
						case "new-game-config":
							await handleNewGameConfig(clientContext, parsedMessage);
							await handleJoinRooms();
							break;
						case "lobby-room-join-request":
							await handleGameRoomGetData(clientContext, parsedMessage);
							await handleJoinRooms();
							break;
						case "rooms-join":
							await sendPlayerUpdatedRooms(clientContext.socket, clientContext.userId)
							break;
						case "lobby-room-leave":
							const room = activeGameRooms.get(parsedMessage.roomId)
							if (room) {

								lobbyFuncs.playerLeft.bind(room)(clientContext.userId);
								await handleJoinRooms();
							}
							break;
						case "lobby-room-delete":
							if (await handleDeleteGameRoom(clientContext, parsedMessage)) {
								fastifyInstance.log.info(`Game room deleted: ${parsedMessage.roomId}`);
								await handleJoinRooms();
							}
							break;
						case "lobby-room-player-set-ready":
							const gameRoom = activeGameRooms.get(parsedMessage.roomId);
							if (gameRoom) {
								if (lobbyFuncs.lobbySetPlayerReady.bind(gameRoom)(clientContext.userId, parsedMessage.ready))
									await handleJoinRooms();
							} else {
								fastifyInstance.log.error(`Game room not found: ${parsedMessage.roomId}`);
							}
							break;
						case "lobby-room-start-game":
							const startGameRoom = activeGameRooms.get(parsedMessage.roomId);
							if (startGameRoom) {
								if (lobbyFuncs.startGame.bind(startGameRoom)(clientContext.userId)) {
									fastifyInstance.log.info(`Game started in room: ${parsedMessage.roomId}`);
									await handleJoinRooms();
								}
							}
							break;
						case "game-room-join":
							if (await handleGameRoomJoin(clientContext, parsedMessage)) {
								fastifyInstance.log.info(`Game room join request: ${parsedMessage.roomId}`);
								await handleJoinRooms();
							}
							break;
						case "game-room-player-set-ready":
							await handleGameRoomPlayerSetReady(clientContext, parsedMessage)
							break;
						case "game-room-player-input":
							await handleGamePlayerInput(clientContext, parsedMessage);
							break;
						case "game-room-leave":
							const roomLeave = activeGameRooms.get(parsedMessage.roomId);
							if (roomLeave) {
								lobbyFuncs.playerLeft.bind(roomLeave)(clientContext.userId)
							}
							await handleGamePlayerLeave(clientContext, parsedMessage);
							break;
						default:
							console.log("unkown message: ", message)
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
			for (const [roomId, room] of activeGameRooms) {
				lobbyFuncs.playerLeft.bind(room)(clientContext.userId)
				room.brackets.forEach(async bracket => {
					if (bracket.game && (bracket.lPlayer === userId || bracket.rPlayer === userId)) {
						await handleGamePlayerLeave(clientContext, {
							type: "game-room-leave",
							gameId: bracket.game.id,
							roomId
						})
					}
				})
			}
			handleJoinRooms();
		});

		socket.on('error', (error) => {
			fastifyInstance.log.error(`WebSocket error with client ${userId}:`, error);
		});
	});
}