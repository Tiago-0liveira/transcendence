import { activeGameRooms, connectedSocketClients } from "@api/websocket"
import { newGameConfigSchema } from "./schemas"
import { ZodError } from "zod"
import { lobbyFuncs } from "./lobby"
import Database from "@db/Database"
import { v4 } from "uuid"

export const handleNewGameConfig = async function (clientContext: ClientThis, message: SelectSocketMessage<"new-game-config">) {
	// validate data
	try {
		newGameConfigSchema.parse(message)
	} catch (error) {
		if (error instanceof ZodError) {
			console.log("here ?", error)
			if (error.errors.length > 0) {
				return clientContext.socket.send(JSON.stringify({
					type: "error-new-game-config",
					error: error.errors[0].message
				} satisfies SelectSocketMessage<"error-new-game-config">))
			}
		} else {
			console.warn(`zod validation - non zod error: ${error}`)
		}
	}
	const roomName = message.roomName.trim();
	// check if roomName already exists
	for (const [, lobby] of activeGameRooms) {
		if (roomName.toLowerCase() === lobby.name.toLowerCase()) {
			return clientContext.socket.send(JSON.stringify({
				type: "error-new-game-config",
				error: "Room name already exists!"
			} satisfies SelectSocketMessage<"error-new-game-config">))
		}
	}
	const lobbyId = v4()

	activeGameRooms.set(lobbyId, {
		id: lobbyId,
		name: message.roomName,
		roomType: message.roomType,
		status: "waiting",
		owner: clientContext.userId,
		lastUpdate: Date.now(),
		requiredPlayers: message.roomType === "1v1" ? 2 : message.playersNumber,
		connectedPlayersNumber: 0,
		connectedPlayers: [],
		brackets: [],
		settings: {
			locality: message.locality,
			visibility: message.visibility
		},
	})
	console.log(`room created: ${message.roomName}`)
	return clientContext.socket.send(JSON.stringify({
		type: "lobby-room-join",
		roomId: lobbyId
	} satisfies SelectSocketMessage<"lobby-room-join">))
}

export const handleGameRoomGetData = async function (clientContext: ClientThis, message: SelectSocketMessage<"lobby-room-join-request">) {
	const room = activeGameRooms.get(message.roomId)
	const connectedUser = connectedSocketClients.get(clientContext.userId);

	if (!room) {
		return clientContext.socket.send(JSON.stringify({
			type: "lobby-room-error",
			error: "Room does not exist!"
		} satisfies SelectSocketMessage<"lobby-room-error">))
	} else if (connectedUser !== undefined && connectedUser.connectedToLobby !== null) {
		return clientContext.socket.send(JSON.stringify({
			type: "lobby-room-error",
			error: "You are already connected to another Room!"
		} satisfies SelectSocketMessage<"lobby-room-error">))
	} else if (room.connectedPlayersNumber === room.requiredPlayers && room.status === "waiting") {
		return clientContext.socket.send(JSON.stringify({
			type: "lobby-room-error",
			error: "Room is already full!"
		} satisfies SelectSocketMessage<"lobby-room-error">))
	} else if (room.requiredPlayers - 1 === room.connectedPlayersNumber && room.status === "waiting" && clientContext.userId !== room.owner && !room.connectedPlayers.find(p => p.id === room.owner)) {
		return clientContext.socket.send(JSON.stringify({
			type: "lobby-room-error",
			error: "There's only space for the owner to join the room!"
		} satisfies SelectSocketMessage<"lobby-room-error">))
	} else if (room.status === "active" && room.connectedPlayers.every(p => p.id !== clientContext.userId)) {
		return clientContext.socket.send(JSON.stringify({
			type: "lobby-room-error",
			error: "You can't join this active game room!"
		} satisfies SelectSocketMessage<"lobby-room-error">))
	}
	const dbUser = await Database.getInstance().userTable.getById(clientContext.userId)
	if (dbUser.error) {
		return clientContext.socket.send(JSON.stringify({
			type: "lobby-room-error",
			error: dbUser.error.message
		} satisfies SelectSocketMessage<"lobby-room-error">))
	}
	lobbyFuncs.playerJoined.bind(room)(clientContext.userId, dbUser.result.displayName)

	return clientContext.socket.send(JSON.stringify({
		type: "lobby-room-data-update",
		...room
	} satisfies SelectSocketMessage<"lobby-room-data-update">))
}


export const handleDeleteGameRoom = async function (clientContext: ClientThis, message: SelectSocketMessage<"lobby-room-delete">): Promise<boolean> {
	const room = activeGameRooms.get(message.roomId)
	if (!room) {
		clientContext.socket.send(JSON.stringify({
			type: "lobby-room-error",
			error: "Room does not exist!"
		} satisfies SelectSocketMessage<"lobby-room-error">))
		return false;
	}
	if (room.owner !== clientContext.userId) {
		clientContext.socket.send(JSON.stringify({
			type: "lobby-room-error",
			error: "You are not the owner of this room!"
		} satisfies SelectSocketMessage<"lobby-room-error">))
		return false;
	}
	if (room.status === "active") {
		clientContext.socket.send(JSON.stringify({
			type: "lobby-room-error",
			error: "You cannot delete an active game room!"
		} satisfies SelectSocketMessage<"lobby-room-error">))
		return false;
	}
	room.connectedPlayers.forEach(player => {
		connectedSocketClients.get(player.id)?.socket?.send(JSON.stringify({
			type: "lobby-room-leave",
			roomId: room.id,
			reason: `Game room ${room.name} has been deleted by the owner.`
		} satisfies SelectSocketMessage<"lobby-room-leave">))
	})
	activeGameRooms.delete(room.id)
	return true
}