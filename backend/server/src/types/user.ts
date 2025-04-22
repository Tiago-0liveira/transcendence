
type UserParams = {
	username: string,
	displayName: string,
	avatarUrl: string,
	password: string,
	authProvider?: string,
	authProviderId?: string,
}

interface User extends UserParams {
	id: number,
	createdAt: Date,
	updatedAt: Date,
	authProvider: string,
	/*wins: number,
	loses: number,
	tournmanetWins: number,
	tournamentLoses: number,*/
}

type UserParamsNoPass = Omit<UserParams, "password">