import AuthManager from "@/auth/authManager";
import SocketHandler from "@/auth/socketHandler";
import { newGameConfigSchema } from "@/auth/validation";
import { authGuard } from "@/router/guards";
import Router from "@/router/Router";
import { z, ZodError } from "zod";

const tournamentTemplate = /* html */`
  <div class="form-input-group">
    <label for="playersNumber" class="form-input-label">Number of Players</label>
    <select name="playersNumber" id="playersNumber" class="form-input">
      <option value="4">4</option>
    </select>
  </div>
`

const visibilityTemplate = /* html */`
	<!--<label for="lobby-public" class="text-left w-48">Public Lobby?</label>
	<input class="ml-1" type="checkbox" name="lobby-public" id="lobby-public" checked>-->
	  <div class="form-input-group">
		<label for="select-visibility" class="form-input-label">Visibility</label>
		<select name="select-visibility" id="select-visibility" class="form-input">
		  <option value="friends" selected>Friends Only</option>
		  <option value="public">Public</option>
		</select>
	  </div>
`

const getNewErrorTemplate = (error: string) => {
	return /* html */`
		<span class="form-message-error">${error}</span>
	`
}

const component = async () => {

	const user = AuthManager.getInstance().User;
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
        <label for="select-locality" class="form-input-label">Locality</label>
        <select name="select-locality" id="select-locality" class="form-input">
          <option value="local" selected>Local</option>
          <option value="online">Online</option>
        </select>
      </div>

      <div id="playersNumber-div" class="form-input-group"></div>
      <div id="public-lobby-div" class="form-input-group"></div>

      <button type="submit" id="btn-create" class="btn-steam-fixed">Create Room</button>
    </form>
  </div>
	`;
	document.querySelector('#app')!.innerHTML = template;

	const form = document.querySelector<HTMLFormElement>("#game-config")
	const selectType = document.querySelector<HTMLSelectElement>("select#select-type")
	const selectLocality = document.querySelector<HTMLSelectElement>("select#select-locality")
	const errorDiv = document.querySelector<HTMLDivElement>("div#errors")

	if (!form) { throw new Error("Could not find form"); }
	if (!selectType) { throw new Error("Could not find select#select-type"); }
	if (!selectLocality) { throw new Error("Could not find select#select-locality"); }
	if (!errorDiv) { throw new Error("Could not find div#errors"); }

	
	const selectTypeChangeHandler = async (ev: Event) => {
		if (!(ev.target instanceof HTMLSelectElement)) return;

		if (["1v1", "tournament"].includes(ev.target.value)) {
			selectTypeChange(ev.target.value as LobbyType)
		} else {
			console.warn("Something is very wrong in select#select-type")
		}
	}
	const selectTypeChange = async (newValue: LobbyType) => {
		const tournamentDiv = document.querySelector<HTMLDivElement>("div#playersNumber-div")
		if (!tournamentDiv) throw new Error("Could not get div#playersNumber-div");

		if (newValue === "tournament") {
			tournamentDiv.innerHTML = tournamentTemplate
		} else {
			tournamentDiv.innerHTML = ``;
		}
	}

	const selectLocalityChangeHandler = async (ev: Event) => {
		if (!(ev.target instanceof HTMLSelectElement)) return;

		if (["local", "online"].includes(ev.target.value)) {
			selectLocalityChange(ev.target.value as "local" | "online")
		}
	}
	const selectLocalityChange = async (newValue: "local" | "online") => {
		const tournamentDiv = document.querySelector<HTMLDivElement>("div#public-lobby-div")
		if (!tournamentDiv) throw new Error("Could not get div#public-lobby-div");

		if (newValue === "online") {
			tournamentDiv.innerHTML = visibilityTemplate
		} else {
			tournamentDiv.innerHTML = ``;
		}
	}

	const formSubmitHandler = async (e: SubmitEvent) => {
		e.preventDefault();
		
		const formData = new FormData(form);
		console.log(formData.get("playersNumber"))
		try {
			const data = {
				roomName: formData.get("roomName")?.toString().trim(),
				playersNumber: Number(formData.get("playersNumber")) || 4,
				roomType: formData.get("select-type"),
				locality: formData.get("select-locality"),
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

	const websocketNewGameConfigErrorHandler: SocketMessageHandler<"error-new-game-config"> = function(res) {
		console.log(`websocket::${res.type}`)
		errorDiv.innerHTML = getNewErrorTemplate(res.error)
	}
	
	selectTypeChange("1v1")
	selectLocalityChange("local")
	selectType.addEventListener("change", selectTypeChangeHandler)
	selectLocality.addEventListener("change", selectLocalityChangeHandler)
	form.addEventListener("submit", formSubmitHandler)
	sh.addMessageHandler("error-new-game-config", websocketNewGameConfigErrorHandler)

	return () => {
		sh.removeMessageHandler("error-new-game-config")
		selectType.removeEventListener("change", selectTypeChangeHandler)
		selectLocality.removeEventListener("change", selectLocalityChangeHandler)
		form.removeEventListener("submit", formSubmitHandler);
	}
}

Router.getInstance().register({ path: '/games/new-config', component, guards: [authGuard] });
