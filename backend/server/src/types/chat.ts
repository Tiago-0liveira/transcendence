interface IrcRoom {
	name: string;
	topic: string;
	members: Set<User>;
	created: Date;
}
