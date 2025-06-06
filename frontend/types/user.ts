type UIDD = {
	id: number;
}

type UserParams = {
	username: 		string,
	displayName?: 	string,
	avatarUrl?: 	string,
	password: 		string,
	authProvider: 	string
}

interface User extends UserParams, UIDD {
	createdAt: Date,
	updatedAt: Date,
	/*wins: number,
	loses: number,
	tournmanetWins: number,
	tournamentLoses: number,*/
}

type UserNoPass = Omit<User, "password">
type UserParamsNoPass = Omit<UserParams, "password">

interface FriendUser extends UIDD, UserParamsNoPass {}

interface PossibleFriendUser extends FriendUser {
	hasInvitedMe: boolean;
	isPending: boolean
}