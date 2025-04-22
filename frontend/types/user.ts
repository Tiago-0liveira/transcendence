type UserParams = {
	username: string,
	displayName?: string,
	avatarUrl?: string,
	password: string
}

interface User extends UserParams {
	id: number,
	createdAt: Date,
	updatedAt: Date,
	/*wins: number,
	loses: number,
	tournmanetWins: number,
	tournamentLoses: number,*/
}

type UserNoPass = Omit<User, "password">
type UserParamsNoPass = Omit<UserParams, "password">
