import { activeGameRooms, connectedSocketClients } from "@api/websocket";
import { GAME_START_TIMER, MAX_PLAYER_DISCONNECT_ACCUMULATED_TIME } from "@utils/defaults";

/**
 * This has to be same as in the frontend!
 */
const REFRESH_RATE_MS = 14 /* 14 ms makes the game run at more than 60fps */

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
	for (const [, lobby] of activeGameRooms) {
		if (lobby.status !== "active") return
		lobby.brackets.forEach(bracket => {
			if (!bracket.game) return

			const game = bracket.game
			const leftP = bracket.game.players.left
			const rightP = bracket.game.players.right
			const now = Date.now()

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
							handleFinnishGameByDisconnectTime(bracket, player);
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
				}
				if (leftP.score === GAME_MAX_SCORE || rightP.score === GAME_MAX_SCORE) {
					handleFinnishGame(game)
				}
			}

			const socketMessage = JSON.stringify({
				type: "game-room-data-update",
				...game
			} satisfies SelectSocketMessage<"game-room-data-update">)
			connectedSocketClients.get(game.players.left.id)?.socket?.send(socketMessage)
			connectedSocketClients.get(game.players.right.id)?.socket?.send(socketMessage)
		})
	}
}, REFRESH_RATE_MS);

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
			velocity: { vx: BALL_BASE_VELOCITY, vy: BALL_BASE_VELOCITY },
			angle: Math.random() > 0.5 ? Math.PI : 0 + Math.random() * 0.5
		}
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
	pl.socket.send(socketMessage)
	pr.socket.send(socketMessage)
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

	pos.x += vel.vx
	pos.y += vel.vy

	// Check for collision with top and bottom walls
	if (pos.y - BALL_RADIUS < 0 || pos.y + BALL_RADIUS > CANVAS.h) {
		vel.vy *= -1; // Reverse vertical velocity
		pos.y = Math.max(BALL_RADIUS, Math.min(CANVAS.h - BALL_RADIUS, pos.y)); // Clamp to prevent clipping
	}

	// Check for collision with the left paddle
	if (
		pos.x - BALL_RADIUS <= PADDLE_OFFSET + PADDLE_W && // Ball is at the left paddle's x
		pos.y >= leftPaddleY && // Ball is within the paddle's top
		pos.y <= leftPaddleY + PADDLE_H // Ball is within the paddle's bottom
	) {
		vel.vx *= -1; // Reverse horizontal velocity
		const hitPosition = pos.y - (leftPaddleY + PADDLE_H / 2); // Relative hit position on paddle
		vel.vy += hitPosition * 0.1; // Adjust vertical velocity based on hit position
		vel.vx += hitPosition * 0.08;
		pos.x = PADDLE_W + PADDLE_OFFSET + BALL_RADIUS; // Reposition to prevent clipping

		vel.vx += BALL_VELOCITY_INCREMENT;
		vel.vy += BALL_VELOCITY_INCREMENT;
	}

	// Check for collision with the right paddle
	if (
		pos.x + BALL_RADIUS >= CANVAS.w - PADDLE_OFFSET - PADDLE_W && // Ball is at the right paddle's x
		pos.y >= rightPaddleY && // Ball is within the paddle's top
		pos.y <= rightPaddleY + PADDLE_H // Ball is within the paddle's bottom
	) {
		vel.vx *= -1; // Reverse horizontal velocity
		const hitPosition = pos.y - (rightPaddleY + PADDLE_H / 2); // Relative hit position on paddle
		vel.vy += hitPosition * 0.1; // Adjust vertical velocity based on hit position
		vel.vx += hitPosition * 0.08;
		pos.x = CANVAS.w - PADDLE_W - BALL_RADIUS - PADDLE_OFFSET; // Reposition to prevent clipping

		vel.vx += BALL_VELOCITY_INCREMENT;
		vel.vy += BALL_VELOCITY_INCREMENT;
	}

	// Check for scoring
	if (pos.x - BALL_RADIUS < 0) {
		return "right"; // Right player scores
	} else if (pos.x + BALL_RADIUS > CANVAS.w) {
		return "left"; // Left player scores
	}
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

function handleFinnishGame(game: Game) {
	game.state = "completed";
}

export const handleGamePlayerLeave = async function (clientContext: ClientThis, message: SelectSocketMessage<"game-room-leave">) {
	const room = activeGameRooms.get(message.roomId);
	if (!room) return;
	const game = room.brackets.find(bracket => bracket.game?.id === message.gameId);
	if (!game || !game.game) return;

	const player = game.lPlayer === clientContext.userId ? game.game.players.left : game.game.players.right
	if (game.game.state === "active") {
		player.connected = false;
		player.disconnectedAt = Date.now()
		game.game.state = "stopped"
		game.game.timer.startAt = Date.now()
	}
}

function handleFinnishGameByDisconnectTime(bracket: GameBracket, player: PlayerActiveGameData) {
	if (!bracket.game) {
		console.warn("handleFinnishGameByDisconnectTime was called with bracket.game null This can't happen!!!")
		return;
	}
	bracket.game.state = "completed"
	bracket.winner = bracket.game.players.left.id === player.id ? bracket.game.players.right.side : bracket.game.players.left.side
}

function handleGameResume(game: Game) {
	game.state = "active"
	game.timer = {
		startAt: Date.now() + GAME_START_TIMER,
		elapsed: 0
	}
}
