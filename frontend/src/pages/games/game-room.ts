import AuthManager from "@/auth/authManager";
import SocketHandler from "@/auth/socketHandler";
import { authGuard } from "@/router/guards";
import Router from "@/router/Router";
import { conditionalRender } from "@/utils/conditionalRender";
import { BALL_RADIUS, CANVAS, MAX_PLAYER_DISCONNECT_ACCUMULATED_TIME, PADDLE, REFRESH_RATE_MS, updatePaddle } from "@/utils/game";
import { timeToText } from "@/utils/general";
import { toastHelper } from "@/utils/toastHelper";

const setError = (el: HTMLDivElement, error: string) => {
	const SpanError = el.querySelector("span#error-message")
	if (SpanError) {
		SpanError.textContent = error;
		if (el.classList.contains("hidden")) {
			el.classList.remove("hidden")
		}
	}
}

const canvasDrawMiddleLine = function (ctx: CanvasRenderingContext2D) {
	ctx.strokeStyle = 'lightgray';
	ctx.lineWidth = 4;

	ctx.setLineDash([13, 13]);// dash size, gap

	// Draw the line
	ctx.beginPath();
	ctx.moveTo(CANVAS.w / 2, 0); // Start
	ctx.lineTo(CANVAS.w / 2, CANVAS.h); // End
	ctx.stroke();
}

const canvasDrawPaddles = function (ctx: CanvasRenderingContext2D, leftY: number, rightY: number) {
	ctx.fillStyle = 'lightgray';
	ctx.fillRect(PADDLE.left.x, leftY, PADDLE.w, PADDLE.h);
	ctx.fillRect(PADDLE.right.x, rightY, PADDLE.w, PADDLE.h);
}

const canvasDrawBall = function (ctx: CanvasRenderingContext2D, ball: GameBallData) {
	ctx.fillStyle = 'lightgray';
	ctx.beginPath();
	ctx.arc(ball.position.x, ball.position.y, BALL_RADIUS, 0, Math.PI * 2);
	ctx.fill();
}

const updateCanvas = function (game: Game, ctx: CanvasRenderingContext2D) {
	ctx.clearRect(0, 0, CANVAS.w, CANVAS.h);

	canvasDrawMiddleLine(ctx)
	canvasDrawPaddles(ctx, game.players.left.paddlePositionY, game.players.right.paddlePositionY)
	canvasDrawBall(ctx, game.ballData)
}

const component = async () => {
	const user = AuthManager.getInstance().User!;
	const sh = SocketHandler.getInstance();
	const router = Router.getInstance();
	let gameRoom: null | Game = null;
	const inputState = { up: false, down: false }
	let goToLobbyIntervalId: number | null = null;
	let returnToLobbyTimer = 5;

	const queryParams = router.getCurrentRoute()?.query
	if (!queryParams || !queryParams.roomId || !queryParams.gameId) {
		return router.navigate("/games/rooms", true)
	}
	const dataUpdateIntervalId = setInterval(() => {
		if (!gameRoom || !["active", "stopped"].includes(gameRoom.state)) return

		const thisPlayer = gameRoom.players.left.id === user.id ? gameRoom.players.left : gameRoom.players.right;

		if (gameRoom.timer.startAt !== 0) {


		} else {
			/* predict movement on clientSide */
			updatePaddle(thisPlayer, inputState.up, inputState.down)
		}

		const canvas = document.getElementById("gameCanvas")
		if (!canvas) throw new Error("Could not find canvas")
		const ctx = (canvas as HTMLCanvasElement).getContext("2d")
		if (!ctx) throw new Error("Could not get canvas context 2d!")

		updateCanvas(gameRoom, ctx)

		/* send actual data to server to get the real one */
		if (gameRoom.timer.startAt === 0) {
			sh.sendMessage({
				type: "game-room-player-input",
				gameId: gameRoom.id,
				roomId: gameRoom.lobbyId,
				...inputState
			} satisfies SelectSocketMessage<"game-room-player-input">)
		}
	}, REFRESH_RATE_MS);

	// TODO: add auto redirect to /games/rooms if the room does not exist
	const template = /* html */`
		<div class="game-room flex-1 flex flex-col">
			<div id="game-ui" class="z-10 absolute w-full flex-1">
				<div id="player-names" class="select-none absolute top-10 text-white flex items-center justify-evenly w-full px-48">
					
				</div>
				<div id="game-result-banner" class="absolute hidden w-full z-10 top-14 flex-col items-center justify-center  bg-gray-500 bg-opacity-80 text-white space-y-4">
					<h1 class="text-9xl flex items-center justify-center space-x-4">
						<span id="span-cup" class="hidden items-center justify-center"><img class="w-32" src="/cup.svg" alt="trophy image"></span>
						<span id="span-sad-face" class="hidden items-center justify-center"><img class="w-32" src="/sad-face.svg" alt="trophy image"></span>
						<span id="game-result-banner-text"></span>
					</h1>
					<span class="flex flex-col items-center justify-center">
						<span>Redirecting to Lobby in <span id="redirect-number"></span>...</span>
					</span>
				</div>
				<div id="timer-div" class="rounded-full fixed p-4 hidden bg-gray-50 items-center justify-center top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[-1/2]">
					<span id="timer-left" class="hidden"></span>
					<span id="player-disconnected-time-left" class="hidden"></span>
				</div>
				<button id="btn-set-ready" class="absolute top-[15%] left-1/2 transform -translate-x-1/2 -translate-y-[-15%] mt-40 text-white"></button>
				<div id="div-loading" class="bg-gray-300 absolute rounded-md p-4 w-80 flex space-x-8 items-center top-1/2 left-1/2  transform -translate-x-1/2 -translate-y-1/2">
					<span class="text-2xl">Loading game Data...</span>
					<loading-spinner size="sm"></loading-spinner>
				</div>
				<div id="game-error" class="hidden">
					<div class="text-2xl">
						<span>Error: </span>
						<span id="error-message" class="text-red-500"></span>
					</div>
					<a href="/games/rooms" class="link">Return to Open Rooms</a>
				</div>
			</div>
			<div id="room-content" class="w-full flex-1 flex items-center justify-center">
				<canvas id="gameCanvas" style="width:${CANVAS.w}px;height:${CANVAS.h}px;" width="${CANVAS.w}" height="${CANVAS.h}" class="bg-black"></canvas>
			</div>
		</div>
	`;
	document.querySelector('#app')!.innerHTML = template;
	const divLoading = document.querySelector<HTMLDivElement>("div#div-loading")
	const divContent = document.querySelector<HTMLDivElement>("div#room-content")
	const divError = document.querySelector<HTMLDivElement>("div#game-error")
	if (!divLoading) throw new Error("Could not find div#div-loading!")
	if (!divContent) throw new Error("Could not find div#room-content!")
	if (!divError) throw new Error("Could not find div#game-error!")

	const btnPlayerSetReadyHandler = (btn: HTMLButtonElement) => {
		console.log("set ready status clicked");
		if (!gameRoom) return;
		if (gameRoom.state !== "waiting") return;

		const readyStatus = btn.dataset.ready;
		if (!["false", "true"].includes(readyStatus || "")) {
			toastHelper.error("Stop messing with the button!")
			return;
		}
		sh.sendMessage({
			type: "game-room-player-set-ready",
			roomId: queryParams.roomId,
			gameId: gameRoom.id,
			ready: readyStatus !== "true"
		} satisfies SelectSocketMessage<"game-room-player-set-ready">)
	}
	const btnGoBackHandler = (btn: HTMLButtonElement) => {
		if (!gameRoom) return;
		router.navigate("/games/lobby-room", false, {}, { roomId: gameRoom.lobbyId })
	}
	divLoading.style.display = "none";

	sh.addMessageHandler("game-room-error", function (res) {
		// TODO: redirect user to /games/rooms with timer
		divLoading.style.display = "none";
		divContent.style.display = "none";
		setError(divError, res.error)
	})
	sh.addMessageHandler("game-room-data-update", function (res) {
		divError.style.display = "none";

		gameRoom = res
		const playerNamesDiv = document.querySelector<HTMLDivElement>("div#player-names");
		if (!playerNamesDiv) throw new Error("Could not find div#player-names")

		const leftP = gameRoom.players.left;
		const rightP = gameRoom.players.right;
		const thisPlayer = leftP.id === user.id ? leftP : rightP;
		const readyButton = document.querySelector<HTMLButtonElement>("button#btn-set-ready");
		if (!readyButton) throw new Error("Could not find button#btn-set-ready")
		let lNameText;
		let rNameText;
		if (gameRoom.state === "waiting") {
			if (readyButton.classList.contains("hidden"))
				readyButton.classList.remove("hidden");
			if (thisPlayer.ready) {
				readyButton.classList.remove("bg-green-500");
				readyButton.classList.add("bg-red-500");
			} else {
				readyButton.classList.remove("bg-red-500");
				readyButton.classList.add("bg-green-500");
			}
			readyButton.dataset.ready = String(thisPlayer.ready);
			readyButton.textContent = thisPlayer.ready ? "Set Not Ready" : "Set Ready";
			lNameText = `${leftP.name} (${leftP.ready ? "Ready" : "Not Ready"})`;
			rNameText = `${rightP.name} (${rightP.ready ? "Ready" : "Not Ready"})`;
		} else {
			if (!readyButton.classList.contains("hidden"))
				readyButton.classList.add("hidden")
			lNameText = leftP.name;
			rNameText = rightP.name;
			if (gameRoom.state === "active" || gameRoom.state === "stopped") {
				const timerDiv = document.querySelector("div#timer-div")
				const startTimerSpan = document.querySelector("span#timer-left")
				const disconnectedPlayerTimeLeftSpan = document.querySelector("span#player-disconnected-time-left")

				if (!timerDiv) throw new Error("Could not find div#timer-div")
				if (!startTimerSpan) throw new Error("Could not find span#timer-left")
				if (!disconnectedPlayerTimeLeftSpan) throw new Error("Could not find span#player-disconnected-time-left")

				if (gameRoom.timer.startAt !== 0) {
					if (timerDiv.classList.contains("hidden")) {
						timerDiv.classList.remove("hidden")
					}
					if (gameRoom.state === "stopped") {
						if (disconnectedPlayerTimeLeftSpan.classList.contains("hidden")) {
							disconnectedPlayerTimeLeftSpan.classList.remove("hidden")
						}
						const disconnectedPlayer = !gameRoom.players.left.connected ? gameRoom.players.left : gameRoom.players.right

						const timeLeft = MAX_PLAYER_DISCONNECT_ACCUMULATED_TIME - (Date.now() - disconnectedPlayer.disconnectedAt) - disconnectedPlayer.disconnectedTime

						disconnectedPlayerTimeLeftSpan.textContent = `${disconnectedPlayer.name} has ${timeToText(timeLeft)} to connect!`

						if (!startTimerSpan.classList.contains("hidden")) {
							startTimerSpan.classList.add("hidden")
						}
					} else if (gameRoom.state === "active") {
						if (startTimerSpan.classList.contains("hidden")) {
							startTimerSpan.classList.remove("hidden")
						}
						startTimerSpan.textContent = String((gameRoom.timer.elapsed / 1000).toFixed(0))
						if (!disconnectedPlayerTimeLeftSpan.classList.contains("hidden")) {
							disconnectedPlayerTimeLeftSpan.classList.add("hidden")
						}
					}
				} else {
					if (!timerDiv.classList.contains("hidden")) {
						timerDiv.classList.add("hidden")
					}
				}
			}
		}
		const middleText = conditionalRender(gameRoom.state === "waiting", "vs", leftP.score + " : " + rightP.score)
		playerNamesDiv.innerHTML = /* html */`
			<span class="text-2xl w-96">${lNameText}</span>
			<span class="text-2xl">${middleText}</span>
			<span class="text-2xl w-96">${rNameText}</span>
		`;

		if (gameRoom.state === "active") {
			const canvas = document.getElementById("gameCanvas")
			if (!canvas) throw new Error("Could not find canvas")
			const ctx = (canvas as HTMLCanvasElement).getContext("2d")
			if (!ctx) throw new Error("Could not get canvas context 2d!")
			updateCanvas(gameRoom, ctx)
		}
		if (gameRoom.state === "completed") {
			const resultBanner = document.getElementById("game-result-banner");
			if (!resultBanner || !(resultBanner instanceof HTMLDivElement)) return;
			if (resultBanner.classList.contains("hidden")) {
				resultBanner.classList.remove("hidden")
			}

			const resultBannerText = resultBanner.querySelector("span#game-result-banner-text");
			if (!resultBannerText || !(resultBannerText instanceof HTMLSpanElement)) return;

			const resultBannerIconCup = resultBanner.querySelector("span#span-cup");
			if (!resultBannerIconCup || !(resultBannerIconCup instanceof HTMLSpanElement)) return;
			const resultBannerIconSadFace = resultBanner.querySelector("span#span-sad-face");
			if (!resultBannerIconSadFace || !(resultBannerIconSadFace instanceof HTMLSpanElement)) return;

			const winner = gameRoom.players.left.score > gameRoom.players.right.score ? gameRoom.players.left.id : gameRoom.players.right.id
			if (goToLobbyIntervalId === null) {
				const redirectTimeLeftSpan = document.getElementById("redirect-number")
				if (redirectTimeLeftSpan) {
					redirectTimeLeftSpan.textContent = String(returnToLobbyTimer)
				}
				goToLobbyIntervalId = setInterval(() => {
					const redirectTimeLeftSpan = document.getElementById("redirect-number")
					if (redirectTimeLeftSpan) {
						returnToLobbyTimer--
						redirectTimeLeftSpan.textContent = String(returnToLobbyTimer)
					}

					if (returnToLobbyTimer === 0) {
						if (gameRoom) {
							router.navigate("/games/lobby-room", false, {}, { roomId: gameRoom.lobbyId })
						}
					}
				}, 1000);
			}
			if (winner === user.id) {
				resultBannerIconCup.style.display = "flex"
				resultBannerText.textContent = "You won!"
			} else {
				resultBannerIconSadFace.style.display = "flex"
				resultBannerText.textContent = "You Lost!"
			}
			resultBanner.style.display = "flex"
		}
	})
	sh.addMessageHandler("game-room-leave", function (res) {
		Router.getInstance().navigate("/games/rooms");
	})

	sh.sendMessage({
		type: "game-room-join",
		gameId: queryParams.gameId,
		roomId: queryParams.roomId
	} satisfies SelectSocketMessage<"game-room-join">)

	document.addEventListener("click", (ev: MouseEvent) => {
		if (!ev.target || !(ev.target instanceof Element)) return;

		const btnPlayerSetReady = ev.target.closest("button#btn-set-ready");
		if (btnPlayerSetReady instanceof HTMLButtonElement) {
			btnPlayerSetReadyHandler(btnPlayerSetReady);
		}
		const anchorGotoLobby = ev.target.closest("a#a-go-to-lobby");
		if (anchorGotoLobby instanceof HTMLAnchorElement) {
			ev.preventDefault()
			if (gameRoom) {
				router.navigate("/games/lobby-room", false, {}, { roomId: gameRoom.lobbyId })
			}
		}
		const btnGoBack = ev.target.closest("button#btn-go-back");
		if (btnGoBack instanceof HTMLButtonElement) {
			btnGoBackHandler(btnGoBack);
		}
	})

	document.addEventListener("keydown", (event) => {
		if (!gameRoom) return

		if (event.key === "ArrowUp") inputState.up = true;
		if (event.key === "ArrowDown") inputState.down = true;
	})
	document.addEventListener("keyup", (event) => {
		if (!gameRoom) return

		if (event.key === "ArrowUp") inputState.up = false;
		if (event.key === "ArrowDown") inputState.down = false;
	})

	return () => {
		sh.removeMessageHandler("game-room-error");
		sh.removeMessageHandler("game-room-data-update");
		clearInterval(dataUpdateIntervalId);
		if (goToLobbyIntervalId !== null) clearInterval(goToLobbyIntervalId)
		if (gameRoom) sh.sendMessage({ type: "game-room-leave", roomId: gameRoom.lobbyId, gameId: gameRoom.id } satisfies SelectSocketMessage<"game-room-leave">)
	}
}

Router.getInstance().register({ path: '/games/game-room', component, guards: [authGuard] });
