import { createHmac, timingSafeEqual } from "crypto"
import { JWT_SECRET } from "@config"



function base64UrlEncode(str: string): string {
	return Buffer.from(str).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

function base64UrlDecode(str: string): string {
	str = str.replace(/-/g, "+").replace(/_/g, "/")
	while (str.length % 4) {
		str += "="
	}
	return Buffer.from(str, "base64").toString()
}

function createJWT(payload: object, options: Omit<JWTOptions, "iat">, secret: string = JWT_SECRET): string {
	const header: JWTHeader = { alg: "HS256", typ: "JWT" }
	const now = Math.floor(Date.now() / 1000)

	const finalPayload: JWT = {
		...options,
		payload,
		iat: now,
		exp: now + options.exp
	}

	const encodedHeader = base64UrlEncode(JSON.stringify(header))
	const encodedPayload = base64UrlEncode(JSON.stringify(finalPayload))

	const dataToSign = `${encodedHeader}.${encodedPayload}`
	const signature = createHmac("sha256", secret).update(dataToSign).digest("base64url")

	return `${encodedHeader}.${encodedPayload}.${signature}`
}

function decodeJWT<T extends object = {}>(token: string): DecodedJWT<T> | null {
	try {
		const [headerB64, payloadB64] = token.split(".")

		if (!headerB64 || !payloadB64) {
			return null
		}

		const header = JSON.parse(base64UrlDecode(headerB64))
		const payload = JSON.parse(base64UrlDecode(payloadB64))

		return { header, payload }
	} catch (error) {
		return null
	}
}

function verifyJWT(token: string, secret: string = JWT_SECRET): boolean {
	try {
		const [headerB64, payloadB64, signature] = token.split(".")

		if (!headerB64 || !payloadB64 || !signature) {
			return false
		}

		const dataToSign = `${headerB64}.${payloadB64}`
		const expectedSignature = createHmac("sha256", secret).update(dataToSign).digest("base64url")

		// Use timing-safe comparison to prevent timing attacks
		return timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
	} catch (error) {
		return false
	}
}

export default {
	sign: createJWT,
	verify: verifyJWT,
	decode: decodeJWT,
}

