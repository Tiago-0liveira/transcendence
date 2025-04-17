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
			options: (sub: string) => ({ exp: 60 * 15, sub }),
		},
		refreshToken: {
			options: (sub: string) => ({ exp: 60 * 60 * 24 * 7, sub }),
		},
		oauthToken: {
			options: (sub: string) => ({ exp: 60 * 15, sub })
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
				expires: new Date(Date.now() + 60 * 60 * 24 * 7 * 1000) // 1 Week
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