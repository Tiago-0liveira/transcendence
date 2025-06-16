type GameRoomFuncs = {
	playerJoined: (this: LobbyRoom, playerId: number, name: string) => void;
	playerLeft: (this: LobbyRoom, playerId: number) => void;
	playerReadyChanged: (this: LobbyRoom, playerId: number, ready: boolean) => void;
	getPlayer: (this: LobbyRoom, playerId: number) => BracketPlayer;
	lobbySetPlayerReady: (this: LobbyRoom, playerId: number, ready: boolean) => void;
	gameRoomSetPlayerReady: (this: LobbyRoom, playerId: number, gameRoomId: string, ready: boolean) => void;
	startGame: (this: LobbyRoom, playerId: number) => void;
}

type GameHistory = {
	id: number;
	lobbyId: string;
	winnerId: number;
	loserId: number;
	scoreWinner: number;
	scoreLoser: number;
	startTime: string;
	endTime: string;
	duration: number;
};

type GameHistoryParams = {
	lobbyId: string;
	winnerId: number;
	loserId: number;
	scoreWinner: number;
	scoreLoser: number;
	startTime: string;
	endTime: string;
	duration: number;
};