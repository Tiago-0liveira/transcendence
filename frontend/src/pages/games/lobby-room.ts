import AuthManager from '@/auth/authManager';
import SocketHandler from '@/auth/socketHandler';
import { authGuard } from '@/router/guards';
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

const isRoomFullyReady = (room: LobbyRoom): boolean => {
	return room.requiredPlayers === room.connectedPlayersNumber &&
		room.connectedPlayers.every(p => p.ready);
};

const getUpdatedRoomTemplate = (room: LobbyRoom, userId: number): string => {
	const playerReadyStatus = room.connectedPlayers.find(u => u.id === userId)?.ready || false;


	return /* html */ `
		<div class="profile-card centered auth-box">
			<div class="settings-header login-section">${room.roomType}</div>

			<div class="form-input-group centered-badge">
				<span class="badge ${room.settings.visibility === 'public' ? 'badge-public' : 'badge-private'}">
					${room.settings.visibility === 'public' ? 'Public' : 'Private'}
				</span>
			</div>

			<div class="form-input-group horizontal-inputs room-name-block">
				<span class="form-input-label">Room:</span>
				<span class="highlight room-name-truncated" title="${room.name}">
					${room.name}
				</span>
			</div>

			${room.status === "waiting" ? `
				<div class="form-input-group horizontal-inputs">
					<span class="form-input-label">Status:</span>
					<span class="badge ${playerReadyStatus ? 'badge-green' : 'badge-red'}">
						${playerReadyStatus ? 'Ready' : 'Not Ready'}
					</span>
				</div>

				<div class="form-input-group ready-button-group">
					<button id="btn-set-ready-true" data-ready="true"
						class="btn-steam-fixed ${playerReadyStatus ? 'active' : ''}">Set Ready</button>
					<button id="btn-set-ready-false" data-ready="false"
						class="btn-steam-fixed ${!playerReadyStatus ? 'active' : ''}">Set Not Ready</button>
				</div>

				<div class="form-input-group horizontal-inputs">
					<span class="form-input-label">Players:</span>
					<span class="${room.connectedPlayersNumber !== room.requiredPlayers ? 'text-warning' : 'text-success'}">
						${room.connectedPlayersNumber} / ${room.requiredPlayers}
					</span>
				</div>

				${renderOwnerStatus(room, userId)}
			` : ''}
		</div>
	`;
};

const renderOwnerStatus = (room: LobbyRoom, userId: number): string => {
	const owner = room.connectedPlayers.find(p => p.id === room.owner);
	if (!owner) {
		return `<span class="owner-status owner-missing">Owner is missing</span>`;
	}

	if (room.owner === userId) {
		const allPlayersReadyStatus = isRoomFullyReady(room);

		return /* html */ `
			<div class="owner-status owner-controls">
				<div class="owner-hint">
					You can start the game when all players are connected and ready!
				</div>
				<button id="btn-start-game" class="btn-start-game ${allPlayersReadyStatus ? 'ready' : 'disabled'}">
					Start Game
				</button>
			</div>
		`;
	}

	return '';
};

const renderBrackets = (room: LobbyRoom, userId: number): string => {
	if (room.status === 'waiting') return '';
	const numCols = room.brackets.map(b => b.phase).reduce((acc, curr) => Math.max(acc, curr), 1);

	return /* html */ `
		<div class="brackets-wrapper">
			<div class="brackets-grid" style="grid-template-columns: repeat(${numCols}, 1fr);">
				${room.brackets.map(bracket => {
		const gridPositionFromPhase = `bracket-phase-${bracket.phase}`;

		if (bracket.game === null) {
			const l = room.connectedPlayers.find(p => p.id === bracket.lPlayer);
			const r = room.connectedPlayers.find(p => p.id === bracket.rPlayer);
			const lName = l ? l.name : "To be determined!";
			const rName = r ? r.name : "To be determined!";
			const scoreText = `Score: 0`;

			return `
							<div class="bracket-card ${gridPositionFromPhase}">
								<div class="bracket-names text-danger">
									${lName} vs ${rName}
								</div>
								<div class="bracket-scores">
									<span>${scoreText}</span> <span>${scoreText}</span>
								</div>
								<div class="bracket-status text-yellow-400">
									Waiting for players to finish the games...
								</div>
							</div>
						`;
		}

		const g = bracket.game;
		const l = g.players.left;
		const r = g.players.right;
		const isUserInGame = l.id === userId || r.id === userId;
		const canJoin = ["waiting", "stopped"].includes(g.state) && isUserInGame;
		const lName = room.connectedPlayers.find(p => p.id === g.players.left.id)?.name
		const rName = room.connectedPlayers.find(p => p.id === g.players.right.id)?.name
		const winnerName = bracket.winner && lName && rName && (bracket.winner === "left" ? lName : rName)

		return `
						<div class="bracket-card ${gridPositionFromPhase}">
							<div class="bracket-names">
								<span class="${l.connected ? 'text-success' : 'text-danger'}">${l.name}</span> vs <span class="${r.connected ? 'text-success' : 'text-danger'}">${r.name}</span>
							</div>
							<div class="bracket-scores">
								<span>Score: ${l.score}</span> <span>Score: ${r.score}</span>
							</div>
							<div class="bracket-status">
								${conditionalRender(canJoin, 
									`<button class="btn-steam-fixed mt-2"
										id="btn-join-active-game"
										data-game-id="${g.id}"
										data-room-id="${g.lobbyId}">
										Join Game
									</button>`
								)}
								${conditionalRender(g.state === "waiting", `<span class="text-yellow-400">Waiting for players</span>`)}
								${conditionalRender(g.state === "stopped", `<span class="text-red-400">The game is paused</span>`)}
								${conditionalRender(g.state === "completed", `<span class="text-blue-400">Winner: ${winnerName}</span>`)}
							</div>
						</div>
					`;
	}).join('')}
			</div>
		</div>
	`;
};


const component = async () => {
	const user = AuthManager.getInstance().User!;
	const sh = SocketHandler.getInstance();
	const router = Router.getInstance();
	let gameRoom: LobbyRoom | null = null;

	const queryParams = router.getCurrentRoute()?.query;
	if (!queryParams?.roomId) throw new Error('Room not found!');

	document.querySelector('#app')!.innerHTML = /* html */ `
		<div class="lobby-room">
			<div id="div-loading" class="lobby-loading">
				<span class="loading-text">Loading Lobby Data...</span>
				<loading-spinner size="sm"></loading-spinner>
			</div>
			<div id="lobby-error" class="lobby-error styles=display: none;">
				<p>Error: <span id="error-message"></span></p>
				<a href="/games/rooms" class="return-link">Return to game rooms</a>
			</div>
			<div id="room-content" class="room-content-wrapper"></div>
		</div>
	`;

	const divLoading = document.querySelector<HTMLDivElement>('#div-loading')!;
	const divContent = document.querySelector<HTMLDivElement>('#room-content')!;
	const divError = document.querySelector<HTMLDivElement>('#lobby-error')!;

	const handleSocketMessages = () => {
		sh.addMessageHandler('lobby-room-error', res => {
			divLoading.style.display = 'none';
			divContent.style.display = 'none';
			setError(divError, res.error);
		});

		sh.addMessageHandler('lobby-room-data-update', res => {
			divError.style.display = 'none';
			divLoading.style.display = 'none';
			divContent.innerHTML = `
				${getUpdatedRoomTemplate(res, user.id)}
				${renderBrackets(res, user.id)}
			`;
			gameRoom = res;
		});

		sh.addMessageHandler('lobby-room-leave', res => {
			if (res.reason) toastHelper.warning(res.reason);
			router.navigate('/games/rooms');
		});
	};

	const handleUserActions = (ev: MouseEvent) => {
		if (!(ev.target instanceof Element)) return;
		const targetButton = ev.target.closest('button');
		if (!targetButton) return;

		switch (targetButton.id) {
			case 'btn-set-ready-false':
			case 'btn-set-ready-true': {
				const ready = targetButton.dataset.ready === 'true';
				sh.sendMessage({
					type: 'lobby-room-player-set-ready',
					roomId: gameRoom!.id,
					ready
				});
				break;
			}
			case 'btn-start-game': {
				if (gameRoom && isRoomFullyReady(gameRoom)) {
					sh.sendMessage({
						type: 'lobby-room-start-game',
						roomId: gameRoom.id
					});
				}
				break;
			}
			case "btn-join-active-game": {
				const gameId = targetButton.dataset.gameId;
				const roomId = targetButton.dataset.roomId;

				if (!gameId || !roomId) {
					toastHelper.error("Game not found or room info missing");
					return;
				}

				router.navigate("/games/game-room", {}, { roomId, gameId });
				break;
			}
		}
	};

	const initialize = () => {
		document.addEventListener('click', handleUserActions);
		handleSocketMessages();
		sh.sendMessage({
			type: 'lobby-room-join-request',
			roomId: queryParams.roomId
		});
	};

	initialize();

	return () => {
		if (gameRoom) {
			sh.sendMessage({
				type: 'lobby-room-leave',
				roomId: gameRoom.id
			});
		}
		sh.removeMessageHandler('lobby-room-error');
		sh.removeMessageHandler('lobby-room-data-update');
		document.removeEventListener('click', handleUserActions);
	};
};

Router.getInstance().register({
	path: '/games/lobby-room',
	component,
	guards: [authGuard]
});
