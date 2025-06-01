type GameRoomFuncs = {
	playerJoined: (this: LobbyRoom, playerId: number, name: string) => void;
	playerLeft: (this: LobbyRoom, playerId: number) => void;
	playerReadyChanged: (this: LobbyRoom, playerId: number, ready: boolean) => void;
	getPlayer: (this: LobbyRoom, playerId: number) => BracketPlayer;
	lobbySetPlayerReady: (this: LobbyRoom, playerId: number, ready: boolean) => void;
	gameRoomSetPlayerReady: (this: LobbyRoom, playerId: number, gameRoomId: string, ready: boolean) => void;
	startGame: (this: LobbyRoom, playerId: number) => void;
}