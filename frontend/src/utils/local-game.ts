import { CANVAS, PADDLE_H } from "./game";

export const DEFAULT_LOCAL_PLAYER = (side: GameSide): LocalGamePlayer => ({
    paddlePositionY: CANVAS.h / 2 - (PADDLE_H / 2), // Center paddle vertically
    input: { up: false, down: false }, // No input initially
    side,
    score: 0,
});

export const DEFAULT_BALL_DATA = (): GameBallData => ({
    position: { x: CANVAS.w / 2, y: CANVAS.h / 2 }, // Center ball
    velocity: { vx: 0, vy: 0 }, // No initial velocity until game starts
    angle: 0, // Initial angle (can be randomized later when game starts)
});