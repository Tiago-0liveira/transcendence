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
		<div class="Lobby-Header flex flex-col items-center space-y-4 bg-gray-50 shadow-md rounded-lg p-6 w-full max-w-3xl">
			<h1 class="text-2xl font-bold text-blue-700">${room.roomType}</h1>
			<div class="flex items-center space-x-4">
				<span class="room-name text-lg font-medium text-gray-600">${room.name}</span>
				${conditionalRender(
					room.settings.visibility === 'public',
					`<span class="badge text-green-700 bg-green-100 px-2 py-1 rounded">Public</span>`,
					`<span class="badge text-red-700 bg-red-100 px-2 py-1 rounded">Private</span>`
				)}
			</div>
		</div>
		${conditionalRender(room.status === "waiting", /* html */ `
			<div class="Lobby-Content mt-4 w-full max-w-3xl">
				<div class="players bg-white shadow-md rounded-lg p-6">
					<div class="players-header flex flex-col items-center space-y-4">
						<span class="player-ready flex items-center space-x-4 justify-center">
							<span class="player-ready-status p-2 rounded ${conditionalRender(playerReadyStatus, 'bg-green-100 text-green-700', 'bg-red-100 text-red-700')}">
								${conditionalRender(playerReadyStatus, 'Ready', 'Not Ready')}
							</span>
							<button id="btn-set-ready" data-ready="${playerReadyStatus}" class="p-2 rounded ${conditionalRender(
								!playerReadyStatus,
								'bg-green-500 text-white hover:bg-green-600',
								'bg-red-500 text-white hover:bg-red-600'
							)}">
								${conditionalRender(playerReadyStatus, 'Set Not Ready', 'Set Ready')}
							</button>
						</span>
						<span class="text-gray-600 text-sm">
							Players: 
							<span class="${conditionalRender(room.connectedPlayersNumber !== room.requiredPlayers, 'text-yellow-500', 'text-green-500')}">
								${room.connectedPlayersNumber} / ${room.requiredPlayers}
							</span>
							${renderOwnerStatus(room, userId)}
						</span>
					</div>
				</div>
			</div>
		`)}
		<div class="main-content mt-4 w-full max-w-6xl">
			${renderConnectedPlayers(room)}
			${renderBrackets(room)}
		</div>
	`
}

const renderOwnerStatus = (room: LobbyRoom, userId: number): string => {
	const owner = room.connectedPlayers.find(p => p.id === room.owner)
	if (!owner) {
		return /* html */ `
			<span class="inline-flex items-center text-sm text-red-500">
				Owner is missing
			</span>
		`
	}
	if (room.owner === userId) {
		const startGameButton = conditionalRender(
			room.connectedPlayers.every(p => p.ready),
			'bg-green-500 text-white hover:bg-green-600',
			'bg-gray-400 text-gray-600 cursor-not-allowed'
		)
		return /* html */ `
			<div class="mt-2 text-gray-600 text-sm">
				You can start the game when everyone is ready!
			</div>
			<button id="btn-start-game" class="mt-2 px-4 py-2 rounded ${startGameButton}">Start Game</button>
		`
	}
	return ''
}

const renderConnectedPlayers = (room: LobbyRoom): string => {
	if (room.status !== 'waiting') return ''
	return /* html */ `
		<div class="connected-players grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			${room.connectedPlayers.map(player => /* html */ `
				<div class="player flex items-center justify-between space-x-2 bg-gray-50 shadow rounded p-4">
					<span class="player-name text-lg flex items-center font-medium text-gray-700">
						${player.name}
						${conditionalRender(
							player.id === room.owner,
							`<span class="badge text-purple-700 bg-purple-100 px-2 py-1 rounded ml-2">Owner</span>`
						)}
					</span>
					<span class="w-5 h-5 rounded-full ${conditionalRender(player.ready, 'bg-green-500', 'bg-red-500')}"></span>
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
