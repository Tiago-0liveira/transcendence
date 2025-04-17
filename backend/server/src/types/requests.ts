import { FastifyRequest, RouteGenericInterface } from "fastify";


export interface RequestWithGoogleOauthPayload<T extends RouteGenericInterface = {}> extends FastifyRequest<T> {
	googlePayload: GoogleSignUpPayload;
}

export type RequestPostGoogleSignUpComplete = RequestWithGoogleOauthPayload<{ Body: { user: UserParamsNoPass }} >