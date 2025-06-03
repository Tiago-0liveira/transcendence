export interface IrcChannel {
	name: string;
	topic: string;
	user: Set<number>;
	created: number;
}

export interface IrcMessage {
	type: "IRC_MESSAGE";
	command: string;
	params: string[];
	source: string;
	target: string;
	content: string;
}

export type IrcCommand =
	| "JOIN"
	| "PRIVMSG"
	| "NICK"
	| "LIST"
	| "TOPIC"
	| "NAMES"
	| "QUIT";
