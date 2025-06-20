import { activeGameRooms, connectedSocketClients } from "@api/websocket";
import { GAME_START_TIMER, MAX_PLAYER_DISCONNECT_ACCUMULATED_TIME } from "@utils/defaults";
import { createGame } from "./lobby";
import Database from "@db/Database";

/**
 * This has to be same as in the frontend!
 */
const REFRESH_RATE_MS = 16 /* 16 ms makes the game run at more than 60fps */

export const BALL_RADIUS = 10

export const CANVAS = {
	w: 1152, h: 864
} as const;

const PADDLE_W = CANVAS.w * 0.018;
const PADDLE_H = CANVAS.h * 0.15;
const PADDLE_OFFSET = CANVAS.w * 0.03
const BALL_BASE_VELOCITY = CANVAS.h * 0.01
const BALL_VELOCITY_INCREMENT = BALL_BASE_VELOCITY * 0.023

const PADDLE = {
	w: PADDLE_W, h: PADDLE_H,
	left: { x: PADDLE_OFFSET },
	right: { x: CANVAS.w - PADDLE_W - PADDLE_OFFSET },

	initialY: CANVAS.h / 2 - (PADDLE_H / 2),
	minY: 0,
	maxY: CANVAS.h - PADDLE_H,

	SPEED: CANVAS.h * 0.01,
} as const;

const GAME_MAX_SCORE = 7/* TODO: we can change this later */

/**
 * ENDS HERE
 */

/**
 * @description Game Loop
 */
setInterval(() => {
	activeGameRooms.forEach(lobby => {
		if (lobby.status !== "active") return
		lobby.brackets.forEach(async bracket => {
			if (!bracket.game) return

			const game = bracket.game
			const leftP = bracket.game.players.left
			const rightP = bracket.game.players.right
			const now = Date.now()
			let sendUpdateToLobby = false;

			if (game.timer.startAt !== 0) {
				if (game.state === "active") {
					game.timer.elapsed = game.timer.startAt - now
				}
			}
			if (game.state === "active" && game.timer.startAt !== 0) {/* handle timer when starting or resuming the game */
				if (now >= game.timer.startAt) {
					game.timer.startAt = 0;
				}
			} else if (game.state === "stopped") {
				Object.values(game.players).forEach((player) => {
					if (!player.connected && player.disconnectedAt !== 0) {
						if (now - player.disconnectedAt + player.disconnectedTime >= MAX_PLAYER_DISCONNECT_ACCUMULATED_TIME) {
							const winner = handleFinnishGameByDisconnectTime(bracket, player);
							updateBracketsAfterGameFinnish(lobby, game.id, bracket.phase, winner === "left" ? bracket.lPlayer : bracket.rPlayer)
							sendUpdateToLobby = true
						}
					}
				})
			}
			if (game.state === "active" && game.timer.startAt === 0) {
				updatePlayerWithInput(leftP)
				updatePlayerWithInput(rightP)
				const scorer = updateBall(game.ballData, leftP.paddlePositionY, rightP.paddlePositionY)
				if (scorer === "left" || scorer === "right") {
					handleGoal(game, scorer)
					sendUpdateToLobby = true
				}
				if (leftP.score === GAME_MAX_SCORE || rightP.score === GAME_MAX_SCORE) {
					const winner = handleFinnishGame(bracket, leftP.score === GAME_MAX_SCORE ? leftP.id : rightP.id)
					updateBracketsAfterGameFinnish(lobby, game.id, bracket.phase, winner === "left" ? bracket.lPlayer : bracket.rPlayer)
					sendUpdateToLobby = true
				}
			}/* check if game.state === "completed" and timer.completedAt has elapsed maybe 5min ? idk */
			if (game.state !== "completed") {
				sendGameRoomUpdate(game)
			}
			if (sendUpdateToLobby) {
				const socketMessage = JSON.stringify({ type: "lobby-room-data-update", ...lobby } satisfies SelectSocketMessage<"lobby-room-data-update">)

				lobby.connectedPlayers.forEach(player => {
					const client = connectedSocketClients.get(player.id)
					if (client) {
						client.socket?.send(socketMessage)
					}
				})
			}
		})
	})
}, REFRESH_RATE_MS);


const updatePlayerActiveLobby = (userId: number) => {
	const socketClient = connectedSocketClients.get(userId)
	if (socketClient) {
		socketClient.connectedToLobby = null;
	}
}

export const updateBracketsAfterGameFinnish = async (lobby: LobbyRoom, gameId: string, phase: number, winnerId: number) => {
	let allFinnished = true;
	lobby.brackets.forEach(bracket => {
		if (bracket.dependencyIds.includes(gameId) && bracket.phase === phase + 1) {
			if (bracket.lPlayer === 0) {
				bracket.lPlayer = winnerId;
			} else if (bracket.rPlayer === 0) {
				bracket.rPlayer = winnerId;
			} else {
				throw new Error("This should never be reached!!!!")
			}
			if (bracket.lPlayer !== 0 && bracket.rPlayer !== 0) {
				bracket.ready = true;
				bracket.game = createGame(lobby, bracket.lPlayer, bracket.rPlayer);
			}
		}
		if (bracket.winner === "left") {
			updatePlayerActiveLobby(bracket.rPlayer)
		} else if (bracket.winner === "right") {
			updatePlayerActiveLobby(bracket.lPlayer)
		}
		if (bracket.game?.state !== "completed")
		{
			allFinnished = false;
		}
	});
	if (allFinnished) {
		lobby.status = "completed";

		const db = Database.getInstance();
		const lastBracket = lobby.brackets[lobby.brackets.length - 1];
		if (lastBracket && lastBracket.winner) {
			updatePlayerActiveLobby(lastBracket.winner === "left" ? lastBracket.lPlayer : lastBracket.rPlayer)
		}

		for (const bracket of lobby.brackets) {
			if (!bracket.game || !bracket.winner) continue;

			const game = bracket.game;
			const winnerId = bracket.winner === "left" ? bracket.lPlayer : bracket.rPlayer;
			const loserId = bracket.winner === "left" ? bracket.rPlayer : bracket.lPlayer;

			const winnerScore = game.players[bracket.winner].score;
			const loserScore = game.players[bracket.winner === "left" ? "right" : "left"].score;

			const duration = Date.now() - game.startAt;
			const startTime = new Date(game.startAt).toISOString();
			const endTime = new Date(Date.now()).toISOString()

			// 1. Запись игры в историю
			await db.gameHistoryTable.new({
				lobbyId: lobby.id,
				winnerId,
				loserId,
				scoreWinner: winnerScore,
				scoreLoser: loserScore,
				startTime,
				endTime,
				duration
			});

			// 2. Обновление базовой статистики победителя
			const winnerStats = await db.userStatsTable.getByUserId(winnerId);
			if (winnerStats.result) {
				const s = winnerStats.result;
				await db.userStatsTable.update(winnerId, {
					...s,
					wins: s.wins + 1,
					totalGames: s.totalGames + 1
				});
			}

			// 3. Обновление базовой статистики проигравшего
			const loserStats = await db.userStatsTable.getByUserId(loserId);
			if (loserStats.result) {
				const s = loserStats.result;
				await db.userStatsTable.update(loserId, {
					...s,
					losses: s.losses + 1,
					totalGames: s.totalGames + 1
				});
			}

			// 4. Обновление турнирной статистики — только для финального матча
			if (lobby.roomType === "tournament" && bracket === lastBracket) {
				for (const player of lobby.connectedPlayers) {
					const stats = await db.userStatsTable.getByUserId(player.id);
					if (!stats.result) continue;

					const s = stats.result;
					console.log("ДАННЫЕ ЮЗЕРА: ", player)
					if (player.id === winnerId) {
						await db.userStatsTable.update(player.id, {
							...s,
							tournamentWins: s.tournamentWins + 1
						});
					} else {
						await db.userStatsTable.update(player.id, {
							...s,
							tournamentLosses: s.tournamentLosses + 1
						});
					}
				}
			}
		}
	}
}

export const sendGameRoomUpdate = (game: Game) => {
	const socketMessage = JSON.stringify({
		type: "game-room-data-update",
		...game
	} satisfies SelectSocketMessage<"game-room-data-update">)
	const pl = connectedSocketClients.get(game.players.left.id)
	const pr = connectedSocketClients.get(game.players.right.id)

	/* Send only if connected to the game room */
	if (pl?.socket && game.players.left.connected) pl.socket.send(socketMessage)
	if (pr?.socket && game.players.right.connected) pr.socket.send(socketMessage)
}

export const handleGameRoomJoin = async function (clientContext: ClientThis, message: SelectSocketMessage<"game-room-join">): Promise<boolean> {
	const room = activeGameRooms.get(message.roomId);
	if (!room) {
		clientContext.socket.send(JSON.stringify({
			type: "game-room-error",
			error: "Room does not exist!"
		} satisfies SelectSocketMessage<"game-room-error">));
		return false;
	}
	const game = room.brackets.find(bracket => bracket.game?.id === message.gameId)?.game;
	if (!game) {
		clientContext.socket.send(JSON.stringify({
			type: "game-room-error",
			error: "Game does not exist in this room!"
		} satisfies SelectSocketMessage<"game-room-error">));
		return false;
	} else if (game.state === "completed") {
		clientContext.socket.send(JSON.stringify({
			type: "game-room-error",
			error: "This game has already finnished!"
		} satisfies SelectSocketMessage<"game-room-error">));
		return false;
	}
	const player = game.players.left.id === clientContext.userId ? game.players.left : game.players.right.id === clientContext.userId ? game.players.right : null;
	if (!player) {
		clientContext.socket.send(JSON.stringify({
			type: "game-room-error",
			error: "This is not your game bracket!"
		} satisfies SelectSocketMessage<"game-room-error">));
		return false;
	}
	let updateSecondPlayer = false;
	player.connected = true;
	if (game.state === "stopped") {/* handling game resume and disconnect timer */
		player.disconnectedTime += Date.now() - player.disconnectedAt/* store the amount of time the user has been disconnected for */
		player.disconnectedAt = 0;

		Object.values(game.players).forEach(player => console.log(player.connected))
		if (Object.values(game.players).every(player => player.connected)) {
			handleGameResume(game)
			updateSecondPlayer = true;
		}
	}
	const socketMessage = JSON.stringify({
		type: "game-room-data-update",
		...game,
	} satisfies SelectSocketMessage<"game-room-data-update">);

	if (updateSecondPlayer) {/* update both player if one of them reconnected and both players are now ready in the lobby */
		Object.values(game.players).forEach(player => {
			connectedSocketClients.get(player.id)?.socket?.send(socketMessage);
		})
	} else {
		clientContext.socket.send(socketMessage);
	}

	return true;
}

export const handleGameRoomPlayerSetReady = async function (clientContext: ClientThis, message: SelectSocketMessage<"game-room-player-set-ready">) {
	const room = activeGameRooms.get(message.roomId);
	if (!room) {
		clientContext.socket.send(JSON.stringify({
			type: "game-room-error",
			error: "Room does not exist!"
		} satisfies SelectSocketMessage<"game-room-error">));
		return false;
	}
	const game = room.brackets.find(bracket => bracket.game?.id === message.gameId)?.game;
	if (!game) {
		clientContext.socket.send(JSON.stringify({
			type: "game-room-error",
			error: "Game does not exist in this room!"
		} satisfies SelectSocketMessage<"game-room-error">));
		return false;
	}
	const player = game.players.left.id === clientContext.userId ? game.players.left : game.players.right.id === clientContext.userId ? game.players.right : null;
	if (!player) {
		clientContext.socket.send(JSON.stringify({
			type: "game-room-error",
			error: "This is not your game bracket!"
		} satisfies SelectSocketMessage<"game-room-error">));
		return false;
	}
	if (player.ready === message.ready) return;
	const pl = connectedSocketClients.get(game.players.left.id)
	const pr = connectedSocketClients.get(game.players.right.id)
	if (!pl || !pr) return;
	if (!pl.socket || !pr.socket) return

	player.ready = message.ready;
	if (game.players.left.ready && game.players.right.ready) {
		// GAME STARTS HERE
		game.state = "active"
		game.ballData = {
			position: { x: CANVAS.w / 2, y: CANVAS.h / 2 },
			velocity: { vx: BALL_BASE_VELOCITY, vy: BALL_BASE_VELOCITY }
		}
		game.startAt = Date.now()
		game.timer = {
			startAt: Date.now() + GAME_START_TIMER,
			elapsed: 0,
		}
		game.players.left.paddlePositionY = PADDLE.initialY
		game.players.right.paddlePositionY = PADDLE.initialY
	}
	const socketMessage = JSON.stringify({
		type: "game-room-data-update",
		...game
	} satisfies SelectSocketMessage<"game-room-data-update">)
	if (pl.connected) pl.socket.send(socketMessage)
	if (pr.connected) pr.socket.send(socketMessage)
}

export const handleGamePlayerInput = async function (clientContext: ClientThis, message: SelectSocketMessage<"game-room-player-input">) {
	const room = activeGameRooms.get(message.roomId);
	if (!room) return

	const bracket = room.brackets.find(bracket => bracket.game?.id === message.gameId);
	if (!bracket) return

	const game = bracket.game/* check if players belongs to this room */
	if (!game || (game.players.left.id !== clientContext.userId && game.players.right.id !== clientContext.userId)) return

	const player = game.players.left.id === clientContext.userId ? game.players.left : game.players.right

	player.input.up = message.up;
	player.input.down = message.down;
}

/* same as frontend prediction code so it matches */
const updatePlayerWithInput = function (player: PlayerActiveGameData) {
	if (player.input.up) {
		player.paddlePositionY = Math.max(player.paddlePositionY - PADDLE.SPEED, PADDLE.minY)
	}
	if (player.input.down) {
		player.paddlePositionY = Math.min(player.paddlePositionY + PADDLE.SPEED, PADDLE.maxY)
	}
}

function updateBall(ball: GameBallData, leftPaddleY: number, rightPaddleY: number): BracketWinner {
	const pos = ball.position;
	const vel = ball.velocity;

	const EDGE_HIT_BONUS = 1.0; // small extra speed when hitting paddle near edges

	pos.x += vel.vx;
	pos.y += vel.vy;

	// Bounce off top and bottom
	if (pos.y - BALL_RADIUS < 0 || pos.y + BALL_RADIUS > CANVAS.h) {
		vel.vy *= -1;
		pos.y = Math.max(BALL_RADIUS, Math.min(CANVAS.h - BALL_RADIUS, pos.y));
	}

	// Collision with left paddle
	if (
		pos.x - BALL_RADIUS <= PADDLE_OFFSET + PADDLE_W &&
		pos.y >= leftPaddleY &&
		pos.y <= leftPaddleY + PADDLE_H
	) {
		const hitPos = (pos.y - (leftPaddleY + PADDLE_H / 2)) / (PADDLE_H / 2); // [-1, 1]
		const baseSpeed = Math.hypot(vel.vx, vel.vy);
		const extraSpeed = BALL_VELOCITY_INCREMENT + Math.abs(hitPos) * EDGE_HIT_BONUS;
		const speed = baseSpeed + extraSpeed;
		const angle = hitPos * (Math.PI / 4);

		vel.vx = speed * Math.cos(angle);
		vel.vy = speed * Math.sin(angle);
		if (vel.vx < 0) vel.vx *= -1; // Ensure ball goes right
		pos.x = PADDLE_OFFSET + PADDLE_W + BALL_RADIUS;
	}

	// Collision with right paddle
	if (
		pos.x + BALL_RADIUS >= CANVAS.w - PADDLE_OFFSET - PADDLE_W &&
		pos.y >= rightPaddleY &&
		pos.y <= rightPaddleY + PADDLE_H
	) {
		const hitPos = (pos.y - (rightPaddleY + PADDLE_H / 2)) / (PADDLE_H / 2); // [-1, 1]
		const baseSpeed = Math.hypot(vel.vx, vel.vy);
		const extraSpeed = BALL_VELOCITY_INCREMENT + Math.abs(hitPos) * EDGE_HIT_BONUS;
		const speed = baseSpeed + extraSpeed;
		const angle = hitPos * (Math.PI / 4);

		vel.vx = -speed * Math.cos(angle); // Ensure ball goes left
		vel.vy = speed * Math.sin(angle);
		pos.x = CANVAS.w - PADDLE_OFFSET - PADDLE_W - BALL_RADIUS;
	}

	// Scoring
	if (pos.x - BALL_RADIUS < 0) return "right";
	if (pos.x + BALL_RADIUS > CANVAS.w) return "left";

	return null;
}



function handleGoal(game: Game, scorer: GameSide) {
	if (scorer === "left") {
		game.players.left.score++;
	} else {
		game.players.right.score++;
	}

	game.ballData.position = { x: CANVAS.w / 2, y: CANVAS.h / 2 }
	game.ballData.velocity = {
		vx: BALL_BASE_VELOCITY * (scorer === "left" ? -1 : 1),
		vy: BALL_BASE_VELOCITY * Math.random() * 0.23 * (Math.random() > 0.5 ? 1 : -1)
	}

	game.players.left.paddlePositionY = CANVAS.h / 2 - PADDLE_H / 2
	game.players.right.paddlePositionY = CANVAS.h / 2 - PADDLE_H / 2

	game.players.left.input = { up: false, down: false }
	game.players.right.input = { up: false, down: false }
}

function handleFinnishGame(bracket: GameBracket, winnerId: number): BracketWinner {
	if (!bracket.game) throw new Error("bracket.game cannot be null!!")
	bracket.game.state = "completed";
	bracket.winner = bracket.lPlayer === winnerId ? "left" : "right";
	sendGameRoomUpdate(bracket.game)
	return bracket.winner;
}

export const handleGamePlayerLeave = async function (clientContext: ClientThis, message: SelectSocketMessage<"game-room-leave">) {
	const room = activeGameRooms.get(message.roomId);
	if (!room) return;
	const game = room.brackets.find(bracket => bracket.game?.id === message.gameId);
	if (!game || !game.game) return;

	const player = game.lPlayer === clientContext.userId ? game.game.players.left : game.game.players.right
	player.connected = false;
	player.disconnectedAt = Date.now()
	if (game.game.state === "active") {
		game.game.state = "stopped"
		game.game.timer.startAt = Date.now()
	}
}

function handleFinnishGameByDisconnectTime(bracket: GameBracket, player: PlayerActiveGameData): BracketWinner {
	if (!bracket.game) {
		throw new Error("handleFinnishGameByDisconnectTime was called with bracket.game null This can't happen!!!")
	}
	const pl = bracket.game.players.left;
	const pr = bracket.game.players.right;
	handleFinnishGame(bracket, pl.id === player.id ? pr.id : pl.id)
	return pl.id === player.id ? "right" : "left"
}

function handleGameResume(game: Game) {
	game.state = "active"
	game.timer = {
		startAt: Date.now() + GAME_START_TIMER,
		elapsed: 0
	}
}
