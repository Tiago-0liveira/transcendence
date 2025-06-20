import AuthManager from '@/auth/authManager';
import LocalGameRoomManager from '@/auth/LocalGameManager';
import Router from '@/router/Router';
import { conditionalRender } from '@/utils/conditionalRender';
import { toastHelper } from '@/utils/toastHelper';

const setError = (el: HTMLDivElement, error: string) => {
	const spanError = el.querySelector('span#error-message');
	if (spanError) {
		spanError.textContent = error;
		el.style.display = 'block';
	}
};

const renderTemplate = (room: LocalLobbyRoom) => {
	return /* html */`
	    <div class="profile-card centered auth-box">
			<div class="settings-header login-section">
				<span>Local ${room.type}</span>
				${conditionalRender(room.games.every(game => game.state === "completed"), `
					<span class="bg-blue-500 p-2 rounded-full">completed</span>
				`)}
			</div>
			<div class="flex items-center justify-center">
				<button class="btn-logout" id="btn-delete-local-game">Delete Local Game</button>
			</div>
		</div>
		<div class="profile-card centered auth-box !w-full !max-w-3xl ">
			${renderBrackets(room)}
		</div>
	`
}

const renderBrackets = (room: LocalLobbyRoom): string => {
	const cols = room.games.reduce((cols, game) => Math.max(cols, game.phase), 0)
	return /* html */ `
		<div class="grid gap-y-4 gap-x-4" ${conditionalRender(room.type === "tournament", `style="grid-template-columns: repeat(${cols}, 1fr);"`)}>
			${room.games.map(game => /* html */`
				<local-bracket-card class="flex items-center justify-center phase-${game.phase}"
					game-id="${game.id}"
					state="${game.state}"
					${conditionalRender(game.winner !== null, `winner="${game.winner}"`)}
					canJoin="${game.state !== "completed" && game.dependencyIds.every(gameId => room.games.find(g => g.id === gameId && g.state === 'completed'))}"

					lname="${game.lPlayer}"
					lscore="${game.players.left.score}"
					
					rname="${game.rPlayer}"
					rscore="${game.players.right.score}"
				>
				</local-bracket-card>
			`).join('')}
		</div>
	`;
};

const component = async () => {
	const localGameManager = LocalGameRoomManager.getInstance();
	const router = Router.getInstance();

	document.querySelector('#app')!.innerHTML = /* html */ `
		<div class="lobby-room">
			<div id="lobby-error" class="lobby-error" style="display: none;">
				<p>Error: <span id="error-message"></span></p>
				<div class="flex flex-col">
					<a href="/games/local/create-game" class="return-link">Create a new Room</a>
					<a href="/" class="return-link">Go To Home</a>
				</div>
			</div>
			<div id="room-content" class="w-full flex flex-col">
				
			</div>
		</div>
	`;

	const divContent = document.querySelector<HTMLDivElement>('#room-content')!;
	const divError = document.querySelector<HTMLDivElement>('#lobby-error')!;

	if (!divContent) throw new Error("Could not find #room-content!");
	if (!divError) throw new Error("Could not find #lobby-error!");

	if (localGameManager.activeGameLobby === null) {
		return setError(divError, "No active Game Lobby")
    }
	let gameRoom: LocalLobbyRoom = localGameManager.activeGameLobby;
	divContent.innerHTML = renderTemplate(gameRoom);

	const handleUserActions = (ev: MouseEvent) => {
		if (!(ev.target instanceof Element)) return;
		const targetButton = ev.target.closest('button');
		if (!targetButton) return;

		switch (targetButton.id) {
			case "btn-delete-local-game":
				localGameManager.deleteActiveGameLobby()
				router.navigate("/games/local/create-game")
				break;
			case "btn-join-game": {
				const gameId = targetButton.dataset.gameId;
				
				if (!gameId) {
					toastHelper.error("Game not found or room info missing");
					return;
				}

				router.navigate("/games/local/game-room", false, {}, { gameId });
				break;
			}
		}
	};

	const initialize = () => {
		document.addEventListener('click', handleUserActions);
	};

	initialize();

	return () => {
		document.removeEventListener('click', handleUserActions);
	};
};

Router.getInstance().register({
	path: '/games/local/lobby-room',
	component
});
