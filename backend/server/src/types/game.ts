type GameRoomFuncs = {
	playerJoined: (this: GameRoom, playerId: number, name: string) => void;
	playerLeft: (this: GameRoom, playerId: number) => void;
	playerReadyChanged: (this: GameRoom, playerId: number, ready: boolean) => void;
	getPlayer: (this: GameRoom, playerId: number) => BracketPlayer;
}

interface BackendGameRoom extends GameRoom, GameRoomFuncs {}