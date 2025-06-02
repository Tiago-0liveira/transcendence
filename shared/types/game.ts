type NewGameConfig = {
	roomName: string,
	playersNumber: number,
	roomType: "1v1" | "tournament",
	locality: "local" | "online",
	visibility: "friends" | "public"
}

type LobbyType = "tournament" | "1v1"
type LobbyStatus = "waiting" | "active" | "completed"
type GameSide = "left" | "right"
type BracketWinner = null | GameSide

type GamePlayer = {
	id: number;
	name: string;
	ready: boolean;
}
type BracketPlayer = null | GamePlayer;
type GameTimer = {
	startAt: number,
	elapsed: number,
}

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
	game: Game | null;
}

interface PlayerActiveGameData extends GamePlayer {
	paddlePositionY: number;
	input: { up: boolean, down: boolean },
	side: GameSide;
	connected: boolean; // true if the player is connected to the game room,
	score: number,
	disconnectedTime: number,
	disconnectedAt: number,
}

type GameBallData = {
	position: { x: number, y: number },
	velocity: { vx: number, vy: number },
	angle: number
}

/* Type Game might need a number of "phases" of the tournament so we can organize the brackets */
/* Type GameBracket  could have a property called dependencyIdRoom that would indicate what matches need to conclude after starting this one */
type Game = {
	lobbyId: string;
	id: string;
	state: "waiting" | "active" | "stopped" | "completed";
	players: {
		left: PlayerActiveGameData;
		right: PlayerActiveGameData;
	}
	ballData: GameBallData,
	timer: GameTimer
}

type LobbyRoom = {
	id: string;
	name: string;
	roomType: LobbyType;
	status: LobbyStatus;
	owner: number;
	lastUpdate: number;
	requiredPlayers: number;
	connectedPlayersNumber: number;
	connectedPlayers: GamePlayer[];
	brackets: GameBracket[];
	settings: {
		locality: "local" | "online",
		visibility: "friends" | "public"
	};
}

type BasicPublicLobby = {
	id: string;
	name: string;
	owner: number;
	lobbyType: LobbyType;
	status: LobbyStatus;
	requiredPlayers: number;
	connectedPlayersNumber: number;
	/* if the user receiving this is friends with the owner */
	isFriend: boolean;
}