type ElementStringAttributeValidator<T extends StringsObject, K extends keyof T = keyof T> = {
	required?: boolean;
	values?: T[K][];
	requireAttrs?: string[];
	conditional?: Partial<T>;
}
type ObjectStringAttributeValidator<T extends StringsObject> = {
	[K in keyof T]: ElementStringAttributeValidator<T, K>
}

type StringBool = "true" | "false"

type UserCardAttributes = {
	"variant": "profile" | "possibleFriend" | "friend" | "blocked";
	"user-id": string;
	"avatar-url": string;
	"display-name": string;
	"is-pending": StringBool;
	"has-invited-me": StringBool;
	"online": StringBool;
}

type LoadingSpinnerAttributes = {
	size: "sm" | "md" | "xl"
}

type RoomCardAttributes = {
	"room-id": string;
	name: string;
	owner: string;
	ownerName: string;
	status: LobbyStatus;
	"required-players": string;
	"connected-players-number": string;
	/* if the user receiving this is friends with the owner */
	"is-friend": StringBool;
	"room-type": LobbyType;
	"can-join": StringBool;
}

type BracketCardAttributes = {
	"lobby-id": string;
	"game-id": string;
	state: GameState;
	winner: GameSide;
	ready: StringBool;
	
	lPlayer: string;
	lname: string;
	lconnected: StringBool;
	lscore: string;

	rPlayer: string;
	rname: string;
	rconnected: StringBool;
	rscore: string;
}

type UncompletedBracketCardAttributes = {
	lPlayer: string;
	lname: string;

	rPlayer: string;
	rname: string;
}