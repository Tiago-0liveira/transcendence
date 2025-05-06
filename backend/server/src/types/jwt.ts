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