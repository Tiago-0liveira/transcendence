import { activeGameRooms, connectedSocketClients } from "@api/websocket";
import Database from "@db/Database";
import DEFAULTS from "@utils/defaults";
import { v4 } from "uuid";
import type { WebSocket } from "ws"

// TODO: add setInterval that deletes a room if it is inactive for like 5mins or 10mins
export const lobbyFuncs = {
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
	},
	/**
	 * @description set the player ready status in the lobby
	 */
	lobbySetPlayerReady: function (playerId: number, ready: boolean): boolean {
		const found = this.connectedPlayers.find(player => player.id === playerId)
		if (!found || found.ready === ready) return false;
		found.ready = ready;
		this.lastUpdate = Date.now();
		return true;
	},
	/**
	 * @description set the player ready status in the game room
	 */
	gameRoomSetPlayerReady: function (playerId: number, gameRoomId: string, ready: boolean) {
		const gameRoom = this.brackets.find(bracket => bracket.game?.id === gameRoomId)?.game
		if (!gameRoom) return false;
		const player = gameRoom.players.left.id === playerId ? gameRoom.players.left : gameRoom.players.right.id === playerId ? gameRoom.players.right : null;
		if (!player) return false;
		if (player.ready === ready) return false;
		player.ready = ready;
		this.lastUpdate = Date.now();
		return true;
	},
	/**
	 * @description the owner of the lobby starts the game
	 */
	startGame: function (playerId: number): boolean {
		if (this.owner !== playerId) return false; // Only the owner can start the game
		if (this.status !== "waiting") return false; // Game can only be started if the status is waiting
		if (this.connectedPlayersNumber < this.requiredPlayers) return false; // Not enough players to start the game
		if (this.connectedPlayers.some(player => !player.ready)) return false; // All players must be ready to start the game
		this.status = "active";
		// TODO: gen brackets and maybe rethink brackets structure
		if (this.roomType === "1v1") {
			this.brackets.push({
				lPlayer: this.connectedPlayers[0].id,
				rPlayer: this.connectedPlayers[1].id,
				winner: null,
				game: {
					lobbyId: this.id,
					id: v4(),
					state: "waiting",
					players: {
						left: DEFAULTS.game.playerActive(this.connectedPlayers[0], "left"),
						right: DEFAULTS.game.playerActive(this.connectedPlayers[1], "right")
					},
					ballData: DEFAULTS.game.ballPosition(),
					timer: DEFAULTS.game.timer(),
				}
			})
			const message = JSON.stringify({
				type: "game-room-join",
				roomId: this.id,
				gameId: this.brackets[0].game!.id,
			} satisfies SelectSocketMessage<"game-room-join">)
			this.connectedPlayers.forEach(player => {
				const client = connectedSocketClients.get(player.id)

				if (client && client.socket) {
					client.socket.send(message)
				}
			})
			return true
		} else if (this.roomType === "tournament") {

		}
		return false; // Room type not supported yet
	},
} satisfies GameRoomFuncs;

/**
 * 
 * @param room GameRoom to convert
 * @param isFriend isFriend should be calculated and sent as parameter to this function
 * @returns BasicRoom that is needed for showing which rooms are public in the frontend
 */
export const getBasicLobby = function (room: LobbyRoom, isFriend: boolean = false): BasicPublicLobby {
	return {
		id: room.id,
		name: room.name,
		owner: room.owner,
		lobbyType: room.roomType,
		status: room.status,
		requiredPlayers: room.requiredPlayers,
		connectedPlayersNumber: room.connectedPlayersNumber,
		isFriend,
	}
}

// TODO: add a function that updates only a specific room
// TODO: overall make this more efficient

export const handleJoinRooms = async function () {
	for (const [id, client] of connectedSocketClients) {
		if (client.connected && client.socket) {
			await sendPlayerUpdatedRooms(client.socket, id);
		}
	}
}

export const sendPlayerUpdatedRooms = async function (socket: WebSocket, userId: number) {
	const dbRes = await Database.getInstance().friendsTable.getFriendsWithInfo(userId, 0, 5000);
	if (dbRes.error) return;

	const rooms: BasicPublicLobby[] = []

	let isInsideLobby = false;
	for (const [_id, room] of activeGameRooms) {
		const found = room.connectedPlayers.find(player => player.id === userId)
		if (found) {
			isInsideLobby = true
			socket.send(JSON.stringify({
				type: "lobby-room-data-update",
				...room
			} satisfies SelectSocketMessage<"lobby-room-data-update">))
			break;
		}
		if (room.owner === userId) {
			rooms.push(getBasicLobby(room))
			continue;
		}
		if (room.settings.locality === "online") {
			if (room.settings.visibility === "public") {
				rooms.push(getBasicLobby(room))
				continue;
			}
			const friend = dbRes.result.find((friend) => friend.id === room.owner)
			if (friend) rooms.push(getBasicLobby(room, true))
		}
	}
	if (!isInsideLobby) {
		socket.send(JSON.stringify({
			type: "rooms-update",
			rooms: rooms
		} satisfies SelectSocketMessage<"rooms-update">))
	}
}
