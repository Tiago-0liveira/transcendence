import AuthManager from "@/auth/authManager";
import SocketHandler from "@/auth/socketHandler";
import { newGameConfigSchema } from "@/auth/validation";
import { authGuard } from "@/router/guards";
import Router from "@/router/Router";
import { z, ZodError } from "zod";

const tournamentTemplate = /* html */`
	<label for="playersNumber" class="text-left w-48">Number of Players</label>
	<input type="number" name="playersNumber" id="playersNumber" min=4 max=8 value=4 step=4>
`

const visibilityTemplate = /* html */`
	<!--<label for="lobby-public" class="text-left w-48">Public Lobby?</label>
	<input class="ml-1" type="checkbox" name="lobby-public" id="lobby-public" checked>-->
	<label for="select-visibility" class="text-left w-48">Visibility</label>
	<select name="select-visibility" id="select-visibility" class="p-1 rounded-md border-2 hover:border-black">
		<option value="friends" selected>Friends Only</option>
		<option value="public">Public</option>
	</select>
`

const getNewErrorTemplate = (error: string) => {
	return /* html */`
		<span class="form-error-span text-red-600 ">${error}</span>
	`
}

const component = async () => {

	const user = AuthManager.getInstance().User;
	const sh = SocketHandler.getInstance();

	const template = /* html */`
		<div class="home flex-1 flex flex-col justify-evenly items-center">
			<h1 class="text-black">New Game Config</h1>
			<form id="game-config" class="w-[60%] h-[60%] flex items-center flex-col text-lg">
				<div id="errors" class="w-full flex flex-col mb-2"><!-- errors will be inserted here -->

				</div>
				<div class="flex items-cetner flex-col space-y-1">
					<div id="lobby-name-input" class="w-96 flex items-center">
						<label for="roomName" class="text-left w-48">Room Name: </label>
						<input class="p-1 rounded-md border-2 border-gray-200" type="text" name="roomName" id="roomName" checked>
					</div>
					<div class="select-type w-96 flex items-center">
						<label for="select-type" class="text-left w-48">Type</label>
						<select name="select-type" id="select-type" class="p-1 rounded-md border-2 hover:border-black">
							<option value="1v1" selected>1v1</option>
							<option value="tournament">Tournament</option>
						</select>
					</div>
					<div class="select-locality w-96 flex items-center">
						<label for="select-locality" class="text-left w-48">Locality</label>
						<select name="select-locality" id="select-locality" class="p-1 rounded-md border-2 hover:border-black">
							<option value="local" selected>Local</option>
							<option value="online">Online</option>
						</select>
					</div>
					<div class="checkbox-public-lobby w-96 flex items-center" id="public-lobby-div"><!-- template will be inserted here vvv -->
						
					</div>
					<div class="w-96 flex items-center" id="playersNumber-div"><!-- template will be inserted here vvv -->

					</div>
				</div>
				<div class="buttons mt-4">
					<button type="submit" id="btn-create" class="bg-gray-300">Create Game/Tournament</button>
				</div>
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
			selectTypeChange(ev.target.value as "1v1" | "tournament")
		} else {
			console.warn("Something is very wrong in select#select-type")
		}
	}
	const selectTypeChange = async (newValue: "1v1" | "tournament") => {
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
