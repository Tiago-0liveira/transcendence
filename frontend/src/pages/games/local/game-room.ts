import LocalGameRoomManager from "@/auth/LocalGameManager";
import Router from "@/router/Router";
import { BALL_RADIUS, BALL_VELOCITY_INCREMENT, CANVAS, PADDLE, PADDLE_H, PADDLE_OFFSET, PADDLE_W, updatePaddle } from "@/utils/game";
import { ACTIVE_BALL_DATA, DEFAULT_BALL_DATA, DEFAULT_PADDLE_POS } from "@/utils/local-game";

const setError = (el: HTMLDivElement, error: string) => {
	const SpanError = el.querySelector("span#error-message")
	if (SpanError) {
		SpanError.textContent = error;
		el.style.display = "block"
	}
}

function updateBall(ball: GameBallData, leftPaddleY: number, rightPaddleY: number): BracketWinner {
	const pos = ball.position;
	const vel = ball.velocity;

	const EDGE_HIT_BONUS = 1.0; // small extra speed when hitting paddle near edges

	pos.x += vel.vx;
	pos.y += vel.vy;

	// Bounce off top and bottom
	if (pos.y - BALL_RADIUS < 0 || pos.y + BALL_RADIUS > CANVAS.h) {
		vel.vy *= -1;
		pos.y = Math.max(BALL_RADIUS, Math.min(CANVAS.h - BALL_RADIUS, pos.y));
	}

	// Collision with left paddle
	if (
		pos.x - BALL_RADIUS <= PADDLE_OFFSET + PADDLE_W &&
		pos.y >= leftPaddleY &&
		pos.y <= leftPaddleY + PADDLE_H
	) {
		const hitPos = (pos.y - (leftPaddleY + PADDLE_H / 2)) / (PADDLE_H / 2); // [-1, 1]
		const baseSpeed = Math.hypot(vel.vx, vel.vy);
		const extraSpeed = BALL_VELOCITY_INCREMENT + Math.abs(hitPos) * EDGE_HIT_BONUS;
		const speed = baseSpeed + extraSpeed;
		const angle = hitPos * (Math.PI / 4);

		vel.vx = speed * Math.cos(angle);
		vel.vy = speed * Math.sin(angle);
		if (vel.vx < 0) vel.vx *= -1; // Ensure ball goes right
		pos.x = PADDLE_OFFSET + PADDLE_W + BALL_RADIUS;
	}

	// Collision with right paddle
	if (
		pos.x + BALL_RADIUS >= CANVAS.w - PADDLE_OFFSET - PADDLE_W &&
		pos.y >= rightPaddleY &&
		pos.y <= rightPaddleY + PADDLE_H
	) {
		const hitPos = (pos.y - (rightPaddleY + PADDLE_H / 2)) / (PADDLE_H / 2); // [-1, 1]
		const baseSpeed = Math.hypot(vel.vx, vel.vy);
		const extraSpeed = BALL_VELOCITY_INCREMENT + Math.abs(hitPos) * EDGE_HIT_BONUS;
		const speed = baseSpeed + extraSpeed;
		const angle = hitPos * (Math.PI / 4);

		vel.vx = -speed * Math.cos(angle); // Ensure ball goes left
		vel.vy = speed * Math.sin(angle);
		pos.x = CANVAS.w - PADDLE_OFFSET - PADDLE_W - BALL_RADIUS;
	}

	// Scoring
	if (pos.x - BALL_RADIUS < 0) return "right";
	if (pos.x + BALL_RADIUS > CANVAS.w) return "left";

	return null;
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

const updateCanvas = function (game: LocalGame, ctx: CanvasRenderingContext2D) {
	ctx.clearRect(0, 0, CANVAS.w, CANVAS.h);

	canvasDrawMiddleLine(ctx)
	canvasDrawPaddles(ctx, game.players.left.paddlePositionY, game.players.right.paddlePositionY)
	canvasDrawBall(ctx, game.ballData)
}

const component = async () => {
	const router = Router.getInstance();
	const localGameManager = LocalGameRoomManager.getInstance();

	let goToLobbyIntervalId: number | null = null;
	let redirectAt: null | number = null
	let ctx: CanvasRenderingContext2D | null = null;
	
	const queryParams = router.getCurrentRoute()?.query
	if (!queryParams || !queryParams.gameId || !localGameManager.activeGameLobby) {
		throw new Error("Room not found!")
	}
	const foundGame = localGameManager.activeGameLobby.games.find(game => game.id === queryParams.gameId)
	if (!foundGame) {
		throw new Error("Room not found!");
	} else if (foundGame.state === "completed") {
		throw new Error("Game already completed!");
	}
	let gameRoom: LocalGame = foundGame;
	const dataUpdateIntervalId = setInterval(() => {
		if (!gameRoom) return
		const now = Date.now()


		if (gameRoom.state === "active" && gameRoom.startAt !== 0) {/* handle timer when starting or resuming the gameRoom */
			const timerDiv = document.getElementById("timer-div")
			if (now >= gameRoom.startAt) {
				if (timerDiv && !timerDiv.classList.contains("hidden")) {
					timerDiv.classList.add("hidden")
				}
				gameRoom.startAt = 0;
			} else {
				if (timerDiv) {
					if (timerDiv.classList.contains("hidden")) {
						timerDiv.classList.remove("hidden")
					}
					const timerLeft = document.getElementById("timer-left")
					if (timerLeft) {
						timerLeft.textContent = String(Math.ceil((gameRoom.startAt - now) / 1000))
					}
				}
			}
		} else if (gameRoom.state === "active" && gameRoom.startAt === 0) {
			updatePaddle(gameRoom.players.left, gameRoom.players.left.input.up, gameRoom.players.left.input.down)
			updatePaddle(gameRoom.players.right, gameRoom.players.right.input.up, gameRoom.players.right.input.down)
			const scorer = updateBall(gameRoom.ballData, gameRoom.players.left.paddlePositionY, gameRoom.players.right.paddlePositionY)
			if (scorer) {
				if (scorer === "left") {
					gameRoom.players.left.score++
				} else if (scorer === "right") {
					gameRoom.players.right.score++
				}
				gameRoom.players.left.paddlePositionY = DEFAULT_PADDLE_POS
				gameRoom.players.right.paddlePositionY = DEFAULT_PADDLE_POS
				const spanPlayersMiddleText = document.querySelector<HTMLSpanElement>("span#player-middle-text")
				if (spanPlayersMiddleText) {
					spanPlayersMiddleText.textContent = gameRoom.players.left.score + " : " + gameRoom.players.right.score
				}
				if (gameRoom.players.left.score === 7 || gameRoom.players.right.score === 7) {
					gameRoom.state = "completed"
					gameRoom.ballData = gameRoom.ballData = DEFAULT_BALL_DATA()
					const winner = gameRoom.players.left.score === 7 ? gameRoom.lPlayer : gameRoom.rPlayer
					gameRoom.winner = gameRoom.players.left.score === 7 ? "left" : "right";
					localGameManager.updateAfterGameFinnish(gameRoom.id)
					redirectAt = now + 1000 * 4;
					// handle timer for leaving the game-room
					const gameResultBanner = document.getElementById("game-result-banner")
					if (gameResultBanner) {
						if (gameResultBanner.classList.contains("hidden")) gameResultBanner.classList.remove("hidden")
						const spanCup = document.getElementById("span-cup")
						if (spanCup && spanCup.classList.contains("hidden")) {
							spanCup.classList.remove("hidden")
						}
						const resultText = document.getElementById("game-result-banner-text")
						if (resultText) {
							resultText.textContent = winner + " Wins!"
						}
					}
				} else {
					gameRoom.ballData = gameRoom.ballData = ACTIVE_BALL_DATA()
				}
			}
		} else if (gameRoom.state === "completed") {
			const redirectNumberSpan = document.getElementById("redirect-number")
			if (redirectAt) {
				const timer = Math.floor((redirectAt - now) / 1000)
				if (timer === 0)
				{
					router.navigate("/games/local/lobby-room")
				}
				if (redirectNumberSpan) {
					redirectNumberSpan.textContent = String(timer)
				}
			}
		}

		if (ctx) updateCanvas(gameRoom, ctx)

	}, 16);

	// TODO: add auto redirect to /games/rooms if the room does not exist
	const template = /* html */`
		<div class="game-room flex-1 flex flex-col">
			<div id="game-ui" class="z-10 absolute w-full flex-1">
				<div id="player-names" class="select-none absolute top-10 text-white flex items-center justify-evenly w-full px-48">
					<span class="text-2xl w-96">${gameRoom.lPlayer}</span>
					<span class="text-2xl" id="player-middle-text">vs</span>
					<span class="text-2xl w-96">${gameRoom.rPlayer}</span>
				</div>
				<div id="game-result-banner" class="absolute hidden w-full z-10 top-14 flex-col items-center justify-center  bg-gray-500 bg-opacity-80 text-white space-y-4">
					<h1 class="text-2xl flex items-center justify-center space-x-4">
						<span id="span-cup" class="hidden items-center justify-center"><img class="w-32" src="/cup.svg" alt="trophy image"></span>
						<span id="game-result-banner-text"></span>
					</h1>
					<span class="flex flex-col items-center justify-center">
						<span>Redirecting to Lobby in <span id="redirect-number"></span>...</span>
						<a href="/games/local/lobby-room" class="link">Go to Lobby now!</a>
					</span>
				</div>
				<div id="timer-div" class="rounded-full fixed p-4 hidden bg-gray-50 items-center justify-center top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[-1/2]">
					<span id="timer-left" class=""></span>
				</div>
				<button id="btn-go-back" class="absolute left-6 mt-10 p-2 bg-black rounded-md border-2 border-black hover:border-white transition duration-300 text-white">Go back to Lobby</button>
				<button id="btn-start-game" class="hidden fixed p-2 bg-green-500 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[-1/2] rounded-md border-2 border-black hover:border-white text-white">Start Game</button>
				<button id="btn-resume-game" class="hidden fixed p-2 bg-green-700 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[-1/2] rounded-md border-2 border-black hover:border-white text-white">Resume Game</button>
				<div id="game-error" class="hidden">
					<div class="text-2xl">
						<span>Error: </span>
						<span id="error-message" class="text-red-500"></span>
					</div>
					<a href="/games/local/create-game" class="link">Return to Create Local Game</a>
				</div>
			</div>
			<div id="room-content" class="w-full flex-1 flex items-center justify-center">
				<canvas id="gameCanvas" style="width:${CANVAS.w}px;height:${CANVAS.h}px;" width="${CANVAS.w}" height="${CANVAS.h}" class="bg-black"></canvas>
			</div>
		</div>
	`;
	document.querySelector('#app')!.innerHTML = template;
	const divContent = document.querySelector<HTMLDivElement>("div#room-content")
	const divError = document.querySelector<HTMLDivElement>("div#game-error")
	const spanPlayersMiddleText = document.querySelector<HTMLSpanElement>("span#player-middle-text")
	const buttonStartGame = document.querySelector<HTMLButtonElement>("button#btn-start-game")
	const buttonResumeGame = document.querySelector<HTMLButtonElement>("button#btn-resume-game")
	
	const canvas = document.getElementById("gameCanvas")
	if (!canvas) throw new Error("Could not find canvas")
		
	ctx = (canvas as HTMLCanvasElement).getContext("2d")
	if (!ctx) throw new Error("Could not get canvas context 2d!")
	
	if (!divContent) throw new Error("Could not find div#room-content!")
	if (!divError) throw new Error("Could not find div#game-error!")
	if (!spanPlayersMiddleText) throw new Error("Could not find span#player-middle-text!")
	if (!buttonStartGame) throw new Error("Could not find button#btn-start-game!")
	if (!buttonResumeGame) throw new Error("Could not find button#btn-resume-game!")
						
	const btnGoBackHandler = (btn: HTMLButtonElement) => {
		if (!gameRoom) return;
		router.navigate("/games/local/lobby-room")
	}
	const buttonsHandler = (ev: MouseEvent) => {
		if (!ev.target || !(ev.target instanceof Element)) return;

		const btnGoBack = ev.target.closest("button#btn-go-back");
		if (btnGoBack instanceof HTMLButtonElement) {
			btnGoBackHandler(btnGoBack);
		}
		const btnStartGame = ev.target.closest("button#btn-start-game");
		if (btnStartGame instanceof HTMLButtonElement) {
			gameRoom.state = "active";
			gameRoom.startAt = Date.now() + 4 * 1000; /* 4 seconds to start the game */
			gameRoom.ballData = ACTIVE_BALL_DATA()
			btnStartGame.classList.add("hidden")
		}
		const btnResumeGame = ev.target.closest("button#btn-resume-game");
		if (btnResumeGame instanceof HTMLButtonElement) {
			gameRoom.state = "active";
			gameRoom.startAt = Date.now() + 4 * 1000;
			btnResumeGame.classList.add("hidden")
		}
	}
	const keyDownHandler = (event: KeyboardEvent) => {
		if (!gameRoom) return

		/* pause game */
		if (event.key === "p") {
			if (gameRoom.state === "active")
			{
				gameRoom.state = "stopped";
				if (buttonResumeGame.classList.contains("hidden")) {
					buttonResumeGame.classList.remove("hidden")
				}
			}
		}
		/* right with arrows */
		if (event.key === "ArrowUp") gameRoom.players.right.input.up = true;
		if (event.key === "ArrowDown") gameRoom.players.right.input.down = true;
		/* left with W and S */
		if (event.key === "w") gameRoom.players.left.input.up = true;
		if (event.key === "s") gameRoom.players.left.input.down = true;
	}
	const keyUpHandler = (event: KeyboardEvent) => {
		if (!gameRoom) return

		/* right with arrows */
		if (event.key === "ArrowUp") gameRoom.players.right.input.up = false;
		if (event.key === "ArrowDown") gameRoom.players.right.input.down = false;
		/* left with W and S */
		if (event.key === "w") gameRoom.players.left.input.up = false;
		if (event.key === "s") gameRoom.players.left.input.down = false;
	}

	if (gameRoom.state === "waiting") {
		if (buttonStartGame.classList.contains("hidden")) {
			buttonStartGame.classList.remove("hidden")
		}
	} else if (gameRoom.state === "stopped") {
		if (buttonResumeGame.classList.contains("hidden")) {
			buttonResumeGame.classList.remove("hidden")
		}
	}

	document.addEventListener("click", buttonsHandler)
	document.addEventListener("keydown", keyDownHandler)
	document.addEventListener("keyup", keyUpHandler)

	return () => {
		if (gameRoom.state === "active") {
			gameRoom.state = "stopped"
		}
		clearInterval(dataUpdateIntervalId);
		document.removeEventListener("click", buttonsHandler)
		document.removeEventListener("keydown", keyDownHandler)
		document.removeEventListener("keyup", keyUpHandler)
		if (goToLobbyIntervalId !== null) clearInterval(goToLobbyIntervalId)
	}
}

Router.getInstance().register({ path: '/games/local/game-room', component });
