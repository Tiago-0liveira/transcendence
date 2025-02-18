import bcrypt from "bcrypt"

function base64UrlEncode(str: string): string {
	return Buffer.from(str)
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
	str = str.replace(/-/g, '+').replace(/_/g, '/');
	while (str.length % 4) {
		str += '=';
	}
	return Buffer.from(str, 'base64').toString();
}

function createJWT(payload: object, secret: string): string {
	const header: JWTHeader = { alg: 'HS256', typ: 'JWT' };

	const encodedHeader = base64UrlEncode(JSON.stringify(header));
	const encodedPayload = base64UrlEncode(JSON.stringify(payload));

	const dataToSign = `${encodedHeader}.${encodedPayload}`;
	const signature = bcrypt
		.createHmac('sha256', secret)
		.update(dataToSign)
		.digest('base64url');

	return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function decodeJWT(token: string): { header: any; payload: any } | null {
	try {
		const [headerB64, payloadB64] = token.split('.');

		if (!headerB64 || !payloadB64) {
			return null;
		}

		const header = JSON.parse(base64UrlDecode(headerB64));
		const payload = JSON.parse(base64UrlDecode(payloadB64));

		return { header, payload };
	} catch (error) {
		return null;
	}
}

function verifyJWT(token: string, secret: string): boolean {
	try {
		const [headerB64, payloadB64, signature] = token.split('.');

		if (!headerB64 || !payloadB64 || !signature) {
			return false;
		}

		const dataToSign = `${headerB64}.${payloadB64}`;
		const expectedSignature = bcrypt
			.createHmac('sha256', secret)
			.update(dataToSign)
			.digest('base64url');

		return bcrypt.timingSafeEqual(
			Buffer.from(signature),
			Buffer.from(expectedSignature)
		);
	} catch (error) {
		return false;
	}
}


export default {
	sign: createJWT,
	verify: verifyJWT,
	decode: decodeJWT
}