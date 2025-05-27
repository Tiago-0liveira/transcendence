type NewGameConfig = {
	roomName: string,
	playersNumber: number,
	roomType: "1v1" | "tournament",
	locality: "local" | "online",
	visibility: "friends" | "public"
}

type GameRoomType = "tournament" | "1v1"
type GameRoomStatus = "waiting" | "active" | "completed"
type BracketWinner = null | "left" | "right"

type GameRoomPlayer = {
	id: number;
	name: string;
	ready: boolean;
}
type BracketPlayer = null | GameRoomPlayer;

type GameBracket = {
	/**
	 * @description player id's only
	 */
	lPlayer: number;
	/**
	 * @description player id's only
	 */
	rPlayer: number;
	winner: BracketWinner;
}

type GameRoom = {
	id: string;
	name: string;
	roomType: GameRoomType;
	status: GameRoomStatus;
	owner: number;
	lastUpdate: number;
	requiredPlayers: number;
	connectedPlayersNumber: number;
	connectedPlayers: GameRoomPlayer[];
	brackets: GameBracket[];
	settings: {
		locality: "local" | "online",
		visibility: "friends" | "public"
	};
}

type BasicPublicRoom = {
	id: string;
	name: string;
	owner: number;
	roomType: GameRoomType;
	status: GameRoomStatus;
	requiredPlayers: number;
	connectedPlayersNumber: number;
	/* if the user receiving this is friends with the owner */
	isFriend: boolean;
}