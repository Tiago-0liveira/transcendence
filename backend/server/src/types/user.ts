
type UserParams = {
	username: string,
	displayName?: string,
	avatarUrl?: string,
	password: string,
	authMethod?: string
}

interface User extends UserParams {
	id: number,
	createdAt: Date,
	updatedAt: Date,
	authMethod: string,
	/*wins: number,
	loses: number,
	tournmanetWins: number,
	tournamentLoses: number,*/
}