type ElementStringAttributeValidator<T extends StringsObject> = {
	required?: boolean;
	values?: T[keyof T][];
	requireAttrs?: string[];
	conditional?: Partial<T>;
}
type ObjectStringAttributeValidator<T extends StringsObject> = Record<keyof T, ElementStringAttributeValidator<T>>;

type UserCardAttributes = {
	"variant": "profile" | "possibleFriend" | "friend";
	"user-id": string;
	"avatar-url": string;
	"display-name": string;
	"is-pending": "0" | "1";
	"has-invited-me": "0" | "1";
}