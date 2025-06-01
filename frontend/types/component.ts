type ElementStringAttributeValidator<T extends StringsObject, K extends keyof T = keyof T> = {
	required?: boolean;
	values?: T[K][];
	requireAttrs?: string[];
	conditional?: Partial<T>;
}
type ObjectStringAttributeValidator<T extends StringsObject> = {
	[K in keyof T]: ElementStringAttributeValidator<T, K>
}

type UserCardAttributes = {
	"variant": "profile" | "possibleFriend" | "friend";
	"user-id": string;
	"avatar-url": string;
	"display-name": string;
	"is-pending": "0" | "1";
	"has-invited-me": "0" | "1";
}

type LoadingSpinnerAttributes = {
	size: "sm" | "md" | "xl"
}

type RoomCardAttributes = {
	"room-id": string;
	name: string;
	owner: string;
	status: LobbyStatus;
	"required-players": string;
	"connected-players-number": string;
	/* if the user receiving this is friends with the owner */
	"is-friend": "0" | "1";
	"room-type": LobbyType;
}