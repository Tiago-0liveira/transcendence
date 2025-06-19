import SocketHandler from "@/auth/socketHandler";
import { newGameConfigSchema } from "@/auth/validation";
import { authGuard } from "@/router/guards";
import Router from "@/router/Router";
import { ZodError } from "zod";

const getNewErrorTemplate = (error: string) => {
	return /* html */`
		<span class="form-message-error">${error}</span>
	`
}

const component = async () => {
	const sh = SocketHandler.getInstance();

	const template = /* html */`
		<div class="profile-card centered auth-box signup-box">
			<div class="settings-header login-section">Create Game Room</div>
			
			<form id="game-config" class="settings-form">
			<div id="errors" class="form-message-error"></div>

			<div class="form-input-group">
				<label for="roomName" class="form-input-label">Room Name</label>
				<input class="form-input" type="text" name="roomName" id="roomName" required />
			</div>

			<div class="form-input-group">
				<label for="select-type" class="form-input-label">Game Type</label>
				<select name="select-type" id="select-type" class="form-input">
					<option value="1v1" selected>1v1</option>
					<option value="tournament">Tournament</option>
				</select>
			</div>

			<div class="form-input-group">
				<label for="playersNumber" class="form-input-label">
					<span>Required Players: </span>
					<span id="required-players">Required Players: </span>
				</label>
			</div>

			<div class="form-input-group">
				<label for="select-visibility" class="form-input-label">Visibility</label>
				<select name="select-visibility" id="select-visibility" class="form-input">
					<option value="friends" selected>Friends Only</option>
					<option value="public">Public</option>
				</select>
			</div>

			<button type="submit" id="btn-create" class="btn-steam-fixed">Create Room</button>
			</form>
		</div>
	`;
	document.querySelector('#app')!.innerHTML = template;

	const form = document.querySelector<HTMLFormElement>("#game-config")
	const selectType = document.querySelector<HTMLSelectElement>("select#select-type")
	const errorDiv = document.querySelector<HTMLDivElement>("div#errors")
	const requiredPlayersSpan = document.querySelector<HTMLSpanElement>("span#required-players")

	if (!form) { throw new Error("Could not find form"); }
	if (!selectType) { throw new Error("Could not find select#select-type"); }
	if (!errorDiv) { throw new Error("Could not find div#errors"); }
	if (!requiredPlayersSpan) { throw new Error("Could not find span#required-players"); }


	const selectTypeChangeHandler = async (ev: Event) => {
		if (!(ev.target instanceof HTMLSelectElement)) return;

		if (["1v1", "tournament"].includes(ev.target.value)) {
			selectTypeChange(ev.target.value as LobbyType)
		} else {
			console.warn("Something is very wrong in select#select-type")
		}
	}
	const selectTypeChange = async (newValue: LobbyType) => {
		if (newValue === "tournament") {
			requiredPlayersSpan.textContent = "4"
		} else {
			requiredPlayersSpan.textContent = "2";
		}
	}

	const formSubmitHandler = async (e: SubmitEvent) => {
		e.preventDefault();

		const formData = new FormData(form);
		try {
			const data = {
				roomName: formData.get("roomName")?.toString().trim(),
				roomType: formData.get("select-type"),
				visibility: formData.get("select-visibility") ?? "friends",
			};
			const validated = newGameConfigSchema.parse(data)
			errorDiv.innerHTML = "";

			sh.sendMessage({
				type: "new-game-config",
				...validated
			})

		} catch (error) {
			if (error instanceof ZodError) {
				console.log("zod error: ", error);
				errorDiv.innerHTML = "";/* reset errors */
				error.errors.forEach(err => {
					errorDiv.innerHTML += getNewErrorTemplate(err.message)
				})
			} else {
				console.error("Error: ", error);
			}
		}
	}

	const websocketNewGameConfigErrorHandler: SocketMessageHandler<"error-new-game-config"> = function (res) {
		errorDiv.innerHTML = getNewErrorTemplate(res.error)
	}

	selectTypeChange("1v1")
	selectType.addEventListener("change", selectTypeChangeHandler)
	form.addEventListener("submit", formSubmitHandler)
	sh.addMessageHandler("error-new-game-config", websocketNewGameConfigErrorHandler)

	return () => {
		sh.removeMessageHandler("error-new-game-config")
		selectType.removeEventListener("change", selectTypeChangeHandler)
		form.removeEventListener("submit", formSubmitHandler);
	}
}

Router.getInstance().register({ path: '/games/new-config', component, guards: [authGuard] });
