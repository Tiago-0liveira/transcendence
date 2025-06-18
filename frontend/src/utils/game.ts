/* The code below needs to be the same as /backend/server/src/game/game.ts */
/* Vars */

export const REFRESH_RATE_MS = 16 /* 16 ms makes the game run at more than 60fps */

export const BALL_RADIUS = 10

export const CANVAS = {
	w: 1152, h: 864
} as const;

export const PADDLE_W = CANVAS.w * 0.018;
export const PADDLE_H = CANVAS.h * 0.15;
export const PADDLE_OFFSET = CANVAS.w * 0.03
export const BALL_BASE_VELOCITY = CANVAS.h * 0.01
export const BALL_VELOCITY_INCREMENT = BALL_BASE_VELOCITY * 0.023
export const MAX_PLAYER_DISCONNECT_ACCUMULATED_TIME = 3 * 60 * 1000; /* 3 Minutes in miliseconds */

export const PADDLE = {
	w: PADDLE_W, h: PADDLE_H,
	left: { x: PADDLE_OFFSET },
	right: { x: CANVAS.w - PADDLE_W - PADDLE_OFFSET },

	initialY: CANVAS.h / 2 - (PADDLE_H / 2),
	minY: 0,
	maxY: CANVAS.h - PADDLE_H,

	SPEED: CANVAS.h * 0.01,
} as const;
/* Ends here */

export const updatePaddle = function (player: GamePlayerData, up: boolean, down: boolean) {
	if (up) player.paddlePositionY = Math.max(player.paddlePositionY - PADDLE.SPEED, PADDLE.minY)
	if (down) player.paddlePositionY = Math.min(player.paddlePositionY + PADDLE.SPEED, PADDLE.maxY)
}