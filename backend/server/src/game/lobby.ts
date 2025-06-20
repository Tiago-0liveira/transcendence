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
		const connectedClient = connectedSocketClients.get(playerId)
		if (!connectedClient) return; /* Should never reach */

		if (this.status === "waiting") {
			this.connectedPlayersNumber++;
			this.connectedPlayers.push({ id: playerId, name, ready: false, connected: true })
		} else if (this.status === "active") {
			const p = this.connectedPlayers.find(player => player.id === playerId)
			if (p) {
				p.connected = true;
			}
		}
		this.lastUpdate = Date.now()
	},
	/**
	 * @description what the websocket does when a player leaves
	 */
	playerLeft: function (playerId: number) {
		const player = this.connectedPlayers.find(user => user.id === playerId)
		if (player !== undefined) {
			if (this.status === "active") {
				player.connected = false;
			} else {
				const foundIndex = this.connectedPlayers.indexOf(player)
				this.connectedPlayers.splice(foundIndex, 1)
				this.connectedPlayersNumber--;
			}
			this.lastUpdate = Date.now()
		}
		const connectedClient = connectedSocketClients.get(playerId)
		if (!connectedClient) return; /* Should never reach */
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

		this.connectedPlayers.forEach(connP => {
			const socketClient = connectedSocketClients.get(connP.id);
			if (socketClient) {
				socketClient.connectedToLobby = this;
			}
		})
		if (this.roomType === "1v1") {
			this.brackets.push(createBracket(this, this.connectedPlayers[0].id, this.connectedPlayers[1].id, 1, [], true));
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
			this.brackets = [];
			for (let i = 0; i < this.connectedPlayersNumber; i += 2) {
				this.brackets.push(createBracket(this, this.connectedPlayers[i].id, this.connectedPlayers[i + 1].id));
			}

			/* 2 phase */
			let bracketsPhase2: GameBracket[] = [];
			for (let i = 0; i < this.brackets.length; i += 2) {
				const l = this.brackets[i], r = this.brackets[i + 1];
				bracketsPhase2.push(createBracket(this, 0, 0, 2, [l.game!.id, r.game!.id]));
			}
			this.brackets.push(...bracketsPhase2)

			/* 3 phase */
			if (bracketsPhase2.length > 1) {
				let bracketsPhase3: GameBracket[] = [];
				for (let i = 0; i < bracketsPhase2.length; i += 2) {
					const l = bracketsPhase2[i], r = bracketsPhase2[i + 1];
					bracketsPhase3.push(createBracket(this, 0, 0, 3, [l.game!.id, r.game!.id]));
				}
				this.brackets.push(...bracketsPhase3)
			}


			return true;
		}
		return false; // Room type not supported yet
	},
} satisfies GameRoomFuncs;

export const userCanJoinLobby = function (room: LobbyRoom, userId: number, isFriend: boolean = false): boolean {
	const ownerInRoom = !!room.connectedPlayers.find(p => p.id === room.owner)
	const emptySlots = room.requiredPlayers - room.connectedPlayersNumber 
	const canJoin = (
		((emptySlots >= 1 && ownerInRoom) ||  (!ownerInRoom && ((emptySlots >= 1 && userId === room.owner)) || emptySlots >= 2))
		&& room.status === "waiting")
		|| (room.status === "active" && room.connectedPlayers.some(player => player.id === userId)
	) && ((room.settings.visibility === "friends" && isFriend) || room.settings.visibility === "public");
	return canJoin
}

/**
 * 
 * @param room GameRoom to convert
 * @param isFriend isFriend should be calculated and sent as parameter to this function
 * @returns BasicRoom that is needed for showing which rooms are public in the frontend
 */
export const getBasicLobby = function (room: LobbyRoom, userId: number, isFriend: boolean = false): BasicPublicLobby {
	return {
		id: room.id,
		name: room.name,
		owner: room.owner,
		ownerName: room.connectedPlayers.find(player => player.id === room.owner)?.name ?? "",
		lobbyType: room.roomType,
		status: room.status,
		requiredPlayers: room.requiredPlayers,
		connectedPlayersNumber: room.connectedPlayersNumber,
		isFriend,
		canJoin: userCanJoinLobby(room, userId, isFriend)
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
	const dbRes = await Database.getInstance().friendsTable.getFriendsWithInfo(userId, 0, 50);
	if (dbRes.error) return;

	const rooms: BasicPublicLobby[] = []

	let isInsideLobby = false;
	for (const [_id, room] of activeGameRooms) {
		const found = room.connectedPlayers.find(player => player.id === userId)
		if (found && found.connected) {
			isInsideLobby = true
			socket.send(JSON.stringify({
				type: "lobby-room-data-update",
				...room
			} satisfies SelectSocketMessage<"lobby-room-data-update">))
			break;
		}
		if (room.owner === userId) {
			rooms.push(getBasicLobby(room, userId))
			continue;
		}
		if (room.settings.visibility === "public") {
			rooms.push(getBasicLobby(room, userId))
			continue;
		}
		const friend = dbRes.result.find((friend) => friend.id === room.owner)
		if (friend) rooms.push(getBasicLobby(room, userId, true))
	}
	if (!isInsideLobby) {
		socket.send(JSON.stringify({
			type: "rooms-update",
			rooms: rooms
		} satisfies SelectSocketMessage<"rooms-update">))
	}
}

export const createBracket = function (lobby: LobbyRoom, leftId: number = 0, rightId: number = 0, phase: number = 1, dependencyIds: string[] = [], ready: boolean = false): GameBracket {
	if (phase <= 0) throw new Error("Invalid phase number")

	const leftPlayer = lobby.connectedPlayers.find(player => player.id === leftId)
	const rightPlayer = lobby.connectedPlayers.find(player => player.id === rightId)

	return {
		lPlayer: leftPlayer ? leftPlayer.id : 0,
		rPlayer: rightPlayer ? rightPlayer.id : 0,
		game: leftPlayer && rightPlayer ? createGame(lobby, leftPlayer.id, rightPlayer.id) : null,
		winner: null,
		
		ready, dependencyIds, phase
	}
}


export const createGame = function (lobby: LobbyRoom, lPlayerId: number, rPlayerId: number): Game {
	const lPlayer = lobby.connectedPlayers.find(p => p.id === lPlayerId)
	const rPlayer = lobby.connectedPlayers.find(p => p.id === rPlayerId)
	if (!lPlayer || !rPlayer) throw new Error("Invalid player ids")

	return {
		lobbyId: lobby.id,
		id: v4(),
		state: "waiting",
		players: {
			left: DEFAULTS.game.playerActive(lPlayer, "left"),
			right: DEFAULTS.game.playerActive(rPlayer, "right"),
		},
		startAt: Date.now(),
		ballData: DEFAULTS.game.ballPosition(),
		timer: DEFAULTS.game.timer(),
	};
}