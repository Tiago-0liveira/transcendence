import { BALL_BASE_VELOCITY, CANVAS, PADDLE_H } from "./game";

export const DEFAULT_PADDLE_POS = CANVAS.h / 2 - (PADDLE_H / 2)

export const DEFAULT_LOCAL_PLAYER = (side: GameSide): LocalGamePlayer => ({
    paddlePositionY: DEFAULT_PADDLE_POS, // Center paddle vertically
    input: { up: false, down: false }, // No input initially
    side,
    score: 0,
});

export const DEFAULT_BALL_DATA = (): GameBallData => ({
    position: { x: CANVAS.w / 2, y: CANVAS.h / 2 }, // Center ball
    velocity: { vx: 0, vy: 0 },
});

export const ACTIVE_BALL_DATA = (winner: GameSide = Math.random() > 0.5 ? "left" : "right"): GameBallData => {
    
    return {
        position: { x: CANVAS.w / 2, y: CANVAS.h / 2 },
        velocity: {
            vx: BALL_BASE_VELOCITY * (winner === "left" ? -1 : 1),
            vy: BALL_BASE_VELOCITY * Math.random() * 0.23 * (Math.random() > 0.5 ? 1 : -1)
        }
    }
}