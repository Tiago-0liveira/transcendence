import {
	isSocketValidMessage,
	notify,
	processRawData,
	updateDisconnectedClient,
} from "@utils/websocket";
import type { FastifyInstance } from "fastify";
import jwt from "@utils/jwt";
import {
	handleDeleteGameRoom,
	handleGameRoomGetData,
	handleNewGameConfig,
} from "@game/game-config";
import {
	handleJoinRooms,
	lobbyFuncs,
	sendPlayerUpdatedRooms,
} from "@game/lobby";
import {
	handleGamePlayerInput,
	handleGamePlayerLeave,
	handleGameRoomJoin,
	handleGameRoomPlayerSetReady,
} from "@game/game";
import WebSocket, { RawData } from "ws";
import { handleChatMessage } from "@api/chatHandler";

export const connectedSocketClients: ClientMap = new Map();
export const activeGameRooms: GameRooms = new Map();

//TODO: when a user disconnects, we should update the rooms they were in
let heartbeatTimer: NodeJS.Timeout | null = null;
const PING_INTERVAL_MS = 30 * 1000; // Server sends ping every 30 seconds
const PONG_TIMEOUT_MS = 10 * 1000;

const startServerHeartbeat = (fastify: FastifyInstance) => {
	if (heartbeatTimer) {
		fastify.log.warn("Server heartbeat already running.");
		return;
	}

	heartbeatTimer = setInterval(() => {
		connectedSocketClients.forEach((clientContext, key) => {
			// Check if the client responded to the last ping
			if (clientContext.isSocketAlive === false) {
				fastify.log.warn(`Client ${key} did not respond to ping. Terminating connection.`);
				clientContext.socket?.terminate(); // Forcefully close the socket
				return;
			}

			// Mark client as not alive, expecting a pong soon
			clientContext.isSocketAlive = false;

			// Send a WebSocket PING frame
			try {
				clientContext.socket?.ping();
			} catch (error) {
				fastify.log.error(`Failed to send ping to ${key}:`, error);
				clientContext.socket?.terminate(); // If sending ping fails, connection is likely bad
			}
		});
	}, PING_INTERVAL_MS);

	fastify.log.info(`Server heartbeat started. Pinging clients every ${PING_INTERVAL_MS / 1000} seconds.`);

	// Ensure the heartbeat timer is cleared when the Fastify server closes
	fastify.addHook('onClose', () => {
		if (heartbeatTimer) {
			clearInterval(heartbeatTimer);
			heartbeatTimer = null;
			fastify.log.info('Server heartbeat stopped.');
		}
	});
};

export const websocketHandler = async (fastifyInstance: FastifyInstance) => {
	startServerHeartbeat(fastifyInstance)


	fastifyInstance.get<{
		Querystring: {
			accessToken?: string;
		};
	}>("/ws", { websocket: true }, async (socket, req) => {
		const accessToken = req.query.accessToken;
		if (!accessToken || !jwt.verify(accessToken)) {
			socket.close(4001, "Invalid or missing credentials!");
			return;
		}
		const decodedUser = jwt.decode<AccessTokenPayload>(accessToken);
		if (!decodedUser) {
			socket.close(4001, "Invalid or missing credentials!");
			return;
		}

		const userId = decodedUser.payload.sub;
		const deviceId = decodedUser.payload.deviceId;
		const connectedUser = connectedSocketClients.get(userId)
		const clientContext: ClientThis = { userId, deviceId, socket };

		fastifyInstance.log.info(`Client connected: ${userId}::${deviceId}`);
		updateDisconnectedClient(userId, socket);
		await notify.friendsOnline(userId);

		socket.on("pong", () => {
			if (connectedUser) {
				connectedUser.isSocketAlive = true;
			}
		});

		socket.on(
			"message",
			socketOnMessage(fastifyInstance, socket, clientContext),
		);

		// Handle client disconnect
		socket.on("close", socketOnClose(fastifyInstance, socket, clientContext));

		socket.on("error", (error) => {
			fastifyInstance.log.error(
				`WebSocket error with client ${userId}:`,
				error,
			);
		});
	});
};

const socketOnMessage = (
	fastifyInstance: FastifyInstance,
	socket: WebSocket,
	clientContext: ClientThis,
) =>
	async function (rawMessage: RawData) {
		const timeStart = Date.now();
		try {
			const message = processRawData(rawMessage);
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
						await sendPlayerUpdatedRooms(
							clientContext.socket,
							clientContext.userId,
						);
						break;
					case "lobby-room-leave":
						const room = activeGameRooms.get(parsedMessage.roomId);
						if (room) {
							lobbyFuncs.playerLeft.bind(room)(clientContext.userId);
							await handleJoinRooms();
						}
						break;
					case "lobby-room-delete":
						if (await handleDeleteGameRoom(clientContext, parsedMessage)) {
							fastifyInstance.log.info(
								`Game room deleted: ${parsedMessage.roomId}`,
							);
							await handleJoinRooms();
						}
						break;
					case "lobby-room-player-set-ready":
						const gameRoom = activeGameRooms.get(parsedMessage.roomId);
						if (gameRoom) {
							if (
								lobbyFuncs.lobbySetPlayerReady.bind(gameRoom)(
									clientContext.userId,
									parsedMessage.ready,
								)
							)
								await handleJoinRooms();
						} else {
							fastifyInstance.log.error(
								`Game room not found: ${parsedMessage.roomId}`,
							);
						}
						break;
					case "lobby-room-start-game":
						const startGameRoom = activeGameRooms.get(parsedMessage.roomId);
						if (startGameRoom) {
							if (
								lobbyFuncs.startGame.bind(startGameRoom)(clientContext.userId)
							) {
								fastifyInstance.log.info(
									`Game started in room: ${parsedMessage.roomId}`,
								);
								await handleJoinRooms();
							}
						}
						break;
					case "game-room-join":
						if (await handleGameRoomJoin(clientContext, parsedMessage)) {
							fastifyInstance.log.info(
								`Game room join request: ${parsedMessage.roomId}`,
							);
							await handleJoinRooms();
						}
						break;
					case "game-room-player-set-ready":
						await handleGameRoomPlayerSetReady(clientContext, parsedMessage);
						break;
					case "game-room-player-input":
						await handleGamePlayerInput(clientContext, parsedMessage);
						break;
					case "game-room-leave":
						const roomLeave = activeGameRooms.get(parsedMessage.roomId);
						if (roomLeave) {
							lobbyFuncs.playerLeft.bind(roomLeave)(clientContext.userId);
						}
						await handleGamePlayerLeave(clientContext, parsedMessage);
						break;
					case "chat-message":
						await handleChatMessage(parsedMessage, clientContext);
						break;
					default:
						console.log("unkown message: ", message);
						break;
				}
			} else {
				console.error("INVALID SOCKET MESSAGE!!!");
			}
			const elapsedTime = Date.now() - timeStart;
			if (elapsedTime > 10) {
				console.warn(
					`Long-running message processing: ${elapsedTime} ms, messageType: ${parsedMessage.type}`,
				);
			}
		} catch (error) {
			console.error(error);
		}
	};

const socketOnClose = (
	fastifyInstance: FastifyInstance,
	socket: WebSocket,
	clientContext: ClientThis,
) =>
	async function (rawMessage: RawData) {
		fastifyInstance.log.info(`Client disconnected: ${clientContext.userId}`);
		connectedSocketClients.delete(clientContext.userId);
		for (const [roomId, room] of activeGameRooms) {
			lobbyFuncs.playerLeft.bind(room)(clientContext.userId);
			room.brackets.forEach(async (bracket) => {
				if (
					bracket.game &&
					(bracket.lPlayer === clientContext.userId ||
						bracket.rPlayer === clientContext.userId)
				) {
					await handleGamePlayerLeave(clientContext, {
						type: "game-room-leave",
						gameId: bracket.game.id,
						roomId,
					});
				}
			});
		}
		handleJoinRooms();
	};
