import { activeGameRooms, connectedSocketClients } from "@api/websocket";
import Database from "@db/Database";
import type { WebSocket } from "ws"

// TODO: add setInterval that deletes a room if it is inactive for like 5mins or 10mins
export const gameRoomFuncs = {
	/**
	 * @description what the websocket does when a player joins
	 */
	playerJoined: function (playerId: number, name: string) {
		if (this.connectedPlayersNumber === this.requiredPlayers) {
			/* send error: cannot join, room is full */
			return;
		}
		this.connectedPlayersNumber++;
		this.connectedPlayers.push({ id: playerId, name, ready: false })
		this.lastUpdate = Date.now()
	},
	/**
	 * @description what the websocket does when a player leaves
	 */
	playerLeft: function (playerId: number) {
		const foundIndex = this.connectedPlayers.findIndex(user => user.id === playerId)
		if (foundIndex !== -1) {
			this.connectedPlayers.splice(foundIndex, 1)
			this.connectedPlayersNumber--;
			this.lastUpdate = Date.now()
		}
	},
	/**
	 * @description what the websocket does when a player gets ready or not ready
	 */
	playerReadyChanged: function (playerId: number, ready: boolean) {
		const found = this.connectedPlayers.find(player => player.id === playerId)
		if (!found || found.ready === ready) return;
		found.ready = ready;
		this.lastUpdate = Date.now()
	},
	/**
	 * @description get the player info from its id
	 */
	getPlayer: function (playerId: number) {
		const found = this.connectedPlayers.find(player => player.id === playerId)
		if (found) return found;
		return null;
	}
} satisfies GameRoomFuncs & { [key: string]: (this: GameRoom, ...args: any) => any };

/**
 * 
 * @param room GameRoom to convert
 * @param isFriend isFriend should be calculated and sent as parameter to this function
 * @returns BasicRoom that is needed for showing which rooms are public in the frontend
 */
export const getBasicRoom = function (room: GameRoom, isFriend: boolean = false): BasicPublicRoom {
	return {
		id: room.id,
		name: room.name,
		owner: room.owner,
		roomType: room.roomType,
		status: room.status,
		requiredPlayers: room.requiredPlayers,
		connectedPlayersNumber: room.connectedPlayersNumber,
		isFriend,
	}
}

export const handleJoinRooms = async function () {
	for (const [id, client] of connectedSocketClients) {
		if (client.connected && client.socket) {
			await updateRooms(client.socket, id);
		}
	}
}

export const updateRooms = async function (socket: WebSocket, userId: number) {
	const dbRes = await Database.getInstance().friendsTable.getFriendsWithInfo(userId, 0, 5000);
	if (dbRes.error) return;

	const rooms: BasicPublicRoom[] = []

	let isInsideLobby = false;
	for (const [_id, room] of activeGameRooms) {
		const found = room.connectedPlayers.find(player => player.id === userId)
		if (found)
		{
			isInsideLobby = true
			socket.send(JSON.stringify({
				type: "game-room-data-update",
				...room
			} satisfies SelectSocketMessage<"game-room-data-update">))
			break;
		}
		if (room.owner === userId) {
			rooms.push(getBasicRoom(room))
			continue;
		}
		if (room.settings.locality === "online") {
			if (room.settings.visibility === "public") {
				rooms.push(getBasicRoom(room))
				continue;
			}
			const friend = dbRes.result.find((friend) => friend.id === room.owner)
			if (friend) rooms.push(getBasicRoom(room, true))
		}
	}
	if (!isInsideLobby) {
		socket.send(JSON.stringify({
			type: "rooms-update",
			rooms: rooms
		} satisfies SelectSocketMessage<"rooms-update">))
	}
}