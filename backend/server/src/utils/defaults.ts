// This file contains default values for various configurations.
import type { CookieSerializeOptions } from "@fastify/cookie"

const BaseHttpCookieOptions: Partial<CookieSerializeOptions> = {
	httpOnly: true,
	sameSite: "strict",
	secure: false, // TODO: after enabling https make secure: true aswell	
}

const DEFAULTS = {
	jwt: {
		accessToken: {
			options: (sub: string) => ({ sub, exp: 60 * 15 }),
		},
		refreshToken: {
			options: (sub: string) => ({ sub, exp: 60 * 60 * 24 * 7 }),
		},
		oauthToken: {
			options: (sub: string) => ({ sub, exp: 60 * 15 })
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
				path: "/auth/refresh" /* the only endpoint it is needed */
			}),
			clearOptions: (): CookieSerializeOptions => ({
				...BaseHttpCookieOptions,
				expires: new Date(0),
				path: "/auth/refresh"
			})
		},
		oauthToken: {
			options: (): CookieSerializeOptions => ({
				...BaseHttpCookieOptions,
				expires: new Date(Date.now() + 60 * 15 * 1000)
			})
		}
	}
}

export default DEFAULTS