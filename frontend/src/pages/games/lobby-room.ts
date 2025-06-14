import AuthManager from '@/auth/authManager'
import SocketHandler from '@/auth/socketHandler'
import { authGuard } from '@/router/guards'
import Router from '@/router/Router'
import { conditionalRender } from '@/utils/conditionalRender'
import { toastHelper } from '@/utils/toastHelper'

const setError = (el: HTMLDivElement, error: string) => {
	const spanError = el.querySelector('span#error-message')
	if (spanError) {
		spanError.textContent = error
		el.style.display = 'block'
	}
}

const getUpdatedRoomTemplate = (room: LobbyRoom, userId: number): string => {
	const playerReadyStatus =
		room.connectedPlayers.find(u => u.id === userId)?.ready || false

	return /* html */ `
		<div class="profile-card centered auth-box">
			<div class="settings-header login-section">${room.roomType}</div>
			<div class="form-input-group horizontal-inputs">
				<span class="form-input-label">Room:</span>
				<span class="highlight">${room.name}</span>
				<span class="badge ${room.settings.visibility === 'public' ? 'badge-public' : 'badge-private'}">
					${room.settings.visibility === 'public' ? 'Public' : 'Private'}
				</span>
			</div>
		
			${room.status === "waiting" ? `
				<div class="form-section-divider"></div>
		
				<div class="form-input-group horizontal-inputs">
					<span class="form-input-label">Status:</span>
					<span class="badge ${playerReadyStatus ? 'badge-green' : 'badge-red'}">
						${playerReadyStatus ? 'Ready' : 'Not Ready'}
					</span>
					<button id="btn-set-ready"
							data-ready="${playerReadyStatus}"
							class="btn-steam-fixed small">
						${playerReadyStatus ? 'Set Not Ready' : 'Set Ready'}
					</button>
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

	`
}

const renderOwnerStatus = (room: LobbyRoom, userId: number): string => {
	const owner = room.connectedPlayers.find(p => p.id === room.owner)

	if (!owner) {
		return /* html */ `
			<span class="owner-status owner-missing">
				Owner is missing
			</span>
		`
	}

	if (room.owner === userId) {
		const allReady = room.connectedPlayers.every(p => p.ready)

		return /* html */ `
			<div class="owner-status owner-controls">
				<div class="owner-hint">
					You can start the game when everyone is ready!
				</div>
				<button id="btn-start-game" class="btn-start-game ${allReady ? 'ready' : 'disabled'}">
					Start Game
				</button>
			</div>
		`
	}

	return ''
}

const renderConnectedPlayers = (room: LobbyRoom): string => {
	if (room.status !== 'waiting') return ''

	return /* html */ `
		<div class="connected-players-grid">
			${room.connectedPlayers.map(player => /* html */ `
				<div class="connected-player-card">
					<span class="connected-player-name">
						${player.name}
						${conditionalRender(
		player.id === room.owner,
		`<span class="owner-badge">Owner</span>`
	)}
					</span>
					<span class="connected-player-status ${player.ready ? 'ready' : 'not-ready'}"></span>
				</div>
			`).join('')}
		</div>
	`
}

const renderBrackets = (room: LobbyRoom): string => {
	if (room.status === 'waiting') return ''
	const numCols = room.brackets.map(b => b.phase).reduce((acc, curr) => curr > acc ? curr : acc, 1)

	return /* html */ `
		<div class="brackets grid gap-4" style="grid-template-columns: repeat(${numCols}, 1fr);">
			${room.brackets.map(bracket => {
				const gridPositionFromPhase = `phase-${bracket.phase}`

				if (bracket.game === null) {
					let lPlayerName = ""
					let rPlayerName = ""
					if (bracket.lPlayer !== 0) {
					    const foundPlayer = room.connectedPlayers.find(p => p.id === bracket.lPlayer)
						if (foundPlayer) {
							lPlayerName = foundPlayer.name
						}
					}
					if (bracket.rPlayer !== 0) {
					    const foundPlayer = room.connectedPlayers.find(p => p.id === bracket.rPlayer)
						if (foundPlayer) {
							rPlayerName = foundPlayer.name
						}
					}

					return /* html */`
						<uncompleted-bracket-card
						    class="${gridPositionFromPhase}"
							lPlayer="${bracket.lPlayer}"
							rPlayer="${bracket.rPlayer}"

							${conditionalRender(lPlayerName !== "", `lname="${lPlayerName}"`)}
							${conditionalRender(rPlayerName !== "", `rname="${rPlayerName}"`)}
						></uncompleted-bracket-card>
					`
				}
				return /* html */`
					<bracket-card
						class="${gridPositionFromPhase}"

						lobby-id="${bracket.game.lobbyId}"
						game-id="${bracket.game.id}"
						state="${bracket.game.state}"
						ready="${bracket.ready}"
						${conditionalRender(bracket.winner !== null, `winner="${bracket.winner}"`)}
						
						lPlayer="${bracket.game.players.left.id}"
						lname="${bracket.game.players.left.name}"
						lconnected="${bracket.game.players.left.connected}"
						lscore="${bracket.game.players.left.score}"

						rPlayer="${bracket.game.players.right.id}"
						rname="${bracket.game.players.right.name}"
						rconnected="${bracket.game.players.right.connected}"
						rscore="${bracket.game.players.right.score}"
					></bracket-card>
				`
			}).join('')}
		</div>
	`
}

const component = async () => {
	const user = AuthManager.getInstance().User!
	const sh = SocketHandler.getInstance()
	const router = Router.getInstance()
	let gameRoom: LobbyRoom | null = null

	const queryParams = router.getCurrentRoute()?.query
	if (!queryParams || !queryParams.roomId) {
		throw new Error('Room not found!')
	}

	const template = /* html */ `
		<div class="lobby-room w-full flex flex-col items-center p-6 space-y-6">
			<div id="div-loading" class="flex items-center space-x-4">
				<span class="text-xl text-gray-600">Loading Lobby Data...</span>
				<loading-spinner size="sm"></loading-spinner>
			</div>
			<div id="lobby-error" class="hidden text-center text-red-600">
				<p>Error: <span id="error-message"></span></p>
				<a href="/games/rooms" class="text-blue-500 hover:underline">Return to game rooms</a>
			</div>
			<div id="room-content" class="w-full flex flex-col items-center "></div>
		</div>
	`
	document.querySelector('#app')!.innerHTML = template

	const divLoading = document.querySelector<HTMLDivElement>('#div-loading')!
	const divContent = document.querySelector<HTMLDivElement>('#room-content')!
	const divError = document.querySelector<HTMLDivElement>('#lobby-error')!

	const handleSocketMessages = () => {
		sh.addMessageHandler('lobby-room-error', res => {
			divLoading.style.display = 'none'
			divContent.style.display = 'none'
			setError(divError, res.error)
		})

		sh.addMessageHandler('lobby-room-data-update', res => {
			divError.style.display = 'none'
			divLoading.style.display = 'none'
			divContent.innerHTML = getUpdatedRoomTemplate(res, user.id)
			gameRoom = res
		})

		sh.addMessageHandler('lobby-room-leave', res => {
			if (res.reason) toastHelper.warning(res.reason)
			router.navigate('/games/rooms')
		})
	}

	const initialize = () => {
		document.addEventListener('click', handleUserActions)
		handleSocketMessages()
		sh.sendMessage({
			type: 'lobby-room-join-request',
			roomId: queryParams.roomId
		})
	}

	const handleUserActions = (ev: MouseEvent) => {
		if (!ev.target || !(ev.target instanceof Element)) return

		const targetButton = ev.target.closest('button')
		if (!targetButton) return

		switch (targetButton.id) {
			case 'btn-set-ready':
				handleSetReady(targetButton as HTMLButtonElement)
				break

			case 'btn-start-game':
				if (gameRoom && gameRoom.connectedPlayers.every(p => p.ready)) {
					sh.sendMessage({
						type: 'lobby-room-start-game',
						roomId: gameRoom.id
					})
				}
				break
		}
	}

	const handleSetReady = (btn: HTMLButtonElement) => {
		if (!gameRoom || !gameRoom.connectedPlayers.some(p => p.id === user.id)) {
			return toastHelper.error('You are not connected to this room!')
		}

		const readyStatus = btn.dataset.ready
		if (!['true', 'false'].includes(readyStatus || '')) {
			return toastHelper.error('Invalid ready status!')
		}

		sh.sendMessage({
			type: 'lobby-room-player-set-ready',
			roomId: gameRoom.id,
			ready: readyStatus !== 'true'
		})
	}

	initialize()
	return () => {
		if (gameRoom) {
			sh.sendMessage({
				type: 'lobby-room-leave',
				roomId: gameRoom.id
			})
		}
		sh.removeMessageHandler('lobby-room-error')
		sh.removeMessageHandler('lobby-room-data-update')
		document.removeEventListener('click', handleUserActions)
	}
}

Router.getInstance().register({
	path: '/games/lobby-room',
	component,
	guards: [authGuard]
})
