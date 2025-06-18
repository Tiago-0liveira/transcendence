
type LocalLobbyRoomParams = {
    type: LobbyType;
    playerNames: string[];
}

interface LocalGamePlayer extends GamePlayerData {}

type LocalGame = {
    id: string;
    lPlayer: string;
    rPlayer: string;
    winner: "left" | "right" | null;
    state: GameState;
    dependencyIds: string[];
    startAt: number;
    phase: number;
    players: {
        left: LocalGamePlayer;
        right: LocalGamePlayer;
    };
    ballData: GameBallData;
}

interface LocalLobbyRoom extends LocalLobbyRoomParams {
    games: LocalGame[]
}