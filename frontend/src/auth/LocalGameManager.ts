import { DEFAULT_BALL_DATA, DEFAULT_LOCAL_PLAYER } from "@/utils/local-game";
import { v4 } from "uuid";

/**
 * `LocalGameRoomManager` is a singleton class responsible for creating and managing
 * local game rooms and the games within them.
 */
class LocalGameRoomManager {
    private static instance: LocalGameRoomManager;
    private localRoom: null | LocalLobbyRoom;

    private constructor() {
		this.localRoom = null;
    }

    /**
     * Gets the singleton instance of the LocalGameRoomManager.
     * @returns The singleton instance.
     */
    public static getInstance(): LocalGameRoomManager {
        if (!LocalGameRoomManager.instance) {
            LocalGameRoomManager.instance = new LocalGameRoomManager();
        }
        return LocalGameRoomManager.instance;
    }

    /**
     * Creates a new local game room based on the provided parameters.
     * It handles the initial game creation for 1v1 and tournament types.
     * @param params - The parameters for the new local game room (`type` and `playerNames`).
     * @returns The newly created `LocalGameRoom` object.
     * @throws Error if the number of players does not match the room type requirements.
     */
    public createRoom(params: LocalLobbyRoomParams): LocalLobbyRoom {
        const { type, playerNames } = params;

        // Validate player count based on lobby type
        if (type === "1v1" && playerNames.length !== 2) {
            throw new Error("A 1v1 game room requires exactly 2 players.");
        }
        if (type === "tournament" && playerNames.length !== 4) {
            throw new Error("Local tournaments currently support 4 players.");
        }
        if (params.playerNames.some(name => 
                name === "" ||
                name.toString().trim().length <= 3 ||
                name.toString().trim().length >= 12) ||
                params.playerNames.length !== (new Set(params.playerNames)).size
            ) {
            throw new Error("Player Names must be between 3 and 12 chars and cannot be repeated!")
        }

        const games: LocalGame[] = []; // Array to hold games within this room
        // Logic for creating initial games based on room type
        if (type === "1v1") {
            // For 1v1, create a single game with the two players
            games.push(this.createLocalGame(playerNames[0], playerNames[1]));
        } else if (type === "tournament") {
            for (let i = 0; i < playerNames.length; i += 2) {
                // All initial tournament games are in phase 1, with no dependencies
                games.push(this.createLocalGame(playerNames[i], playerNames[i + 1], 1, []));
            }
            games.push(this.createLocalGame("", "", 2, games.map(game => game.id)))
        }

        this.localRoom = {
            type,
            playerNames,
            games,
        };
        
        console.log(`Local room of type '${type}' created with ${playerNames.length} players and ${this.localRoom!.games.length || 0}.`);
        return this.localRoom;
    }

    /**
     * Creates a single `LocalGame` instance with default properties.
     * This method is private as game creation is typically triggered by `createRoom`.
     * @param lPlayerName - The name of the player on the left side.
     * @param rPlayerName - The name of the player on the right side.
     * @param phase - The phase number if it's part of a tournament (defaults to 1).
     * @param dependencyIds - An array of game IDs that this game depends on (e.g., for tournament progression).
     * @returns A new `LocalGame` object.
     */
    private createLocalGame(
        lPlayerName: string,
        rPlayerName: string,
        phase: number = 1,
        dependencyIds: string[] = []
    ): LocalGame {
        return {
            id: v4(),
            lPlayer: lPlayerName,
            rPlayer: rPlayerName,
            winner: null, // No winner initially
            state: "waiting", // Game starts in a waiting state
            dependencyIds: dependencyIds,
            startAt: 0, // Game start time (set when game begins)
            phase: phase,
            players: {
                left: DEFAULT_LOCAL_PLAYER("left"),
                right: DEFAULT_LOCAL_PLAYER("right"),
            },
            ballData: DEFAULT_BALL_DATA(),
        };
    }

    public get activeGameLobby() {
        return this.localRoom;
    }

    public deleteActiveGameLobby() {
        if (this.localRoom !== null)
        {
            this.localRoom = null;
        }
    }

    public updateAfterGameFinnish(gameId: string) {
        if (!this.localRoom) return;
        if (this.localRoom.type === "tournament") {
            const foundGame = this.localRoom.games.find(game => game.id === gameId)
            if (foundGame && foundGame.state === "completed" && foundGame.winner !== null) {
                const winner = foundGame.winner === "left" ? foundGame.lPlayer : foundGame.rPlayer;
                this.localRoom.games.forEach(game => {
                    if (game.phase === 2) {
                        if (game.lPlayer === "") {
                            game.lPlayer = winner;
                        } else if (game.rPlayer === "") {
                            game.rPlayer = winner;
                        }
                    }
                })
            }
            
        }
    }
}

export default LocalGameRoomManager;