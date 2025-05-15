type JWTHeader = {
	alg: string;
	typ: string;
};

type BlackListToken = {
	token: string
}

type JWTOptions = {
	sub: number
	exp: number
	iat: number
}

type JWT<U = object, T extends JWTOptions = JWTOptions> = T & {
	payload: U
}

interface DecodedJWT<U extends JWTOptions = JWTOptions & {}, T extends object = {}> {
	header: JWTHeader,
	payload: U & { payload: T }
}

type AccessTokenPayload = JWTOptions & { deviceId: string }
type RefreshTokenPayload = AccessTokenPayload