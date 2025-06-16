type UIDD = {
	id: number;
}

interface BaseUserParams {
	username: string,
	displayName: string,
	avatarUrl: string
}

interface UserParams extends BaseUserParams {
	password: string,
	authProvider?: string,
	authProviderId?: number,
}

interface User extends UserParams, UIDD {
	createdAt: Date,
	updatedAt: Date,
	authProvider: string,
	/*wins: number,
	loses: number,
	tournmanetWins: number,
	tournamentLoses: number,*/
}

type UserParamsNoPass = Omit<UserParams, "password">

interface FriendRequest extends UIDD {
	senderId: number;
	receiverId: number;
	status: "pending" | "accepted" | "rejected";
	createdAt: string;
	updatedAt: string;
};

type FriendRequestParams = {
	senderId: number;
	receiverId: number;
	status?: "pending" | "accepted" | "rejected";
};

type Friend = {
	userId: number;
	friendId: number;
	createdAt: string;
};

type FriendParams = {
	userId: number;
	friendId: number;
};

interface FriendUser extends UIDD, BaseUserParams {
	online: boolean;
}

interface PossibleFriendUser extends FriendUser {
	hasInvitedMe: boolean;
	isPending: boolean
}

type User2FA = {
	userId: number;
	enabled: boolean;
	secret: string;
	updatedAt: string;
};

type User2FAParams = {
	userId: number;
	enabled: boolean;
	secret: string;
};

type UserStats = {
	userId: number;
	wins: number;
	losses: number;
	totalGames: number;
	tournamentWins: number;
	tournamentLosses: number;
};

type UserStatsParams = {
	userId: number;
	wins?: number;
	losses?: number;
	totalGames?: number;
	tournamentWins?: number;
	tournamentLosses?: number;
};
