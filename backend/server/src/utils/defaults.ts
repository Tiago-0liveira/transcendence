// This file contains default values for various configurations.
import type { CookieSerializeOptions } from "@fastify/cookie"

const BaseHttpCookieOptions: Partial<CookieSerializeOptions> = {
	httpOnly: true,
	sameSite: "lax",
	secure: false, // TODO: after enabling https make secure: use DEV_MOVE to set secure so it depends on NODE_ENV
}

export const MAX_PLAYER_DISCONNECT_ACCUMULATED_TIME = 3 * 60 * 1000; /* 3 Minutes in miliseconds */
/**
 * @description When the game starts or gets resumed 4 seconds before it actually start so the players are ready
 */
export const GAME_START_TIMER = 4 * 1000; /* 4 seconds in miliseconds */

const DEFAULTS = {
	jwt: {
		accessToken: {
			options: (sub: number, deviceId: string) => ({ deviceId, sub, exp: 60 * 15 }),
		},
		refreshToken: {
			options: (sub: number, deviceId: string) => ({ deviceId, sub, exp: 60 * 60 * 24 * 7 }),
		},
		oauthToken: {
			options: (sub: number) => ({ sub, exp: 60 * 15 })
		}
	},
	cookies: {
		accessToken: {
			options: (): CookieSerializeOptions => ({
				...BaseHttpCookieOptions,
				expires: new Date(Date.now() + 60 * 60 * 24 * 7 * 1000) // 1 Week
			})
		},
		refreshToken: {
			options: (): CookieSerializeOptions => ({
				...BaseHttpCookieOptions,
				expires: new Date(Date.now() + 60 * 60 * 24 * 7 * 1000), // 1 Week
				maxAge: 60 * 60 * 24 * 7,
				path: "/jwt/refresh" /* the only endpoint it is needed */
			}),
			clearOptions: (): CookieSerializeOptions => ({
				...BaseHttpCookieOptions,
				expires: new Date(0),
				path: "/jwt/refresh"
			})
		},
		oauthToken: {
			options: (): CookieSerializeOptions => ({
				...BaseHttpCookieOptions,
				expires: new Date(Date.now() + 60 * 15 * 1000),
				path: "/oauth/google/signup/complete"
			}),
			clearOptions: () => ({
				...BaseHttpCookieOptions,
				expires: new Date(0),
				path: "/oauth/google/signup/complete"
			})
		}
	},
	game: {
		playerActive: (player: GamePlayer, side: GameSide): PlayerActiveGameData => ({
			...player,
			ready: false,/* set player ready to false because it comes from room as true */
			side,
			input: { up: false, down: false },
			paddlePositionY: 0,
			connected: false,
			score: 0,
			disconnectedTime: 0,
			disconnectedAt: 0,
		}),
		ballPosition: (): GameBallData => ({
			position: { x: 0, y: 0 },
			velocity: { vx: 0, vy: 0 }
		}),
		timer: (): GameTimer => ({
			startAt: 0,
			elapsed: 0,
		})
	}
}

export default DEFAULTS