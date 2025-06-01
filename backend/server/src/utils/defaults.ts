// This file contains default values for various configurations.
import type { CookieSerializeOptions } from "@fastify/cookie"

const BaseHttpCookieOptions: Partial<CookieSerializeOptions> = {
	httpOnly: true,
	sameSite: "strict",
	secure: false, // TODO: after enabling https make secure: use DEV_MOVE to set secure so it depends on NODE_ENV
}

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
			score: 0
		}),
		ballPosition: () => ({
			position: { x: 0, y: 0 },
			velocity: { vx: 0, vy: 0 },
			angle: 0,
		} satisfies GameBallData)
	}
}

export default DEFAULTS