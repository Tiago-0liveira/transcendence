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

type JWT<T = JWTOptions, U = object> = T & {
	payload: U
}

type DecodedPayload<U extends object = {}, T extends JWTOptions & { payload: U } = JWTOptions & { payload: U }> = T


interface DecodedJWT<T extends object = {}> {
	header: JWTHeader,
	payload: DecodedPayload<T>
}