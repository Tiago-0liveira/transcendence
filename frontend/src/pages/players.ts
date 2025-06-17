import AuthManager from "@/auth/authManager";
import Router from "@/router/Router";
import { authGuard } from "@/router/guards"
import API from "@/utils/BackendApi";
import { debounce } from "@/utils/requests";

const fetchUsers = (query: string, page: number, limit: number, cb: (query: string, data: { users?: PossibleFriendUser[] }) => void) => {
	const auth = AuthManager.getInstance()

	auth.authFetch(Router.makeUrl(API.auth.friends.possibleFriends, {}, {
		name: query, page: String(page), limit: String(limit)
	}), {
		method: "GET",
	}).then(res => {
		res?.json().then((data: { users?: PossibleFriendUser[] }) => {
			if (data.users) {
				cb(query, data)
			} else {
				console.error("Error fetching users: ", data)
			}
		})
	})
}

const getPlayerLi = (user: PossibleFriendUser) => {
	return /* html */`
		<user-card 
			variant="possibleFriend" 
			user-id="${user.id}" 
			avatar-url="${user.avatarUrl}" 
			display-name="${user.displayName}"
			is-pending="${user.isPending}"
			has-invited-me="${user.hasInvitedMe}"
			id="user-id-${user.id}"
		></user-card>
	`
}

const component = async () => {
	const template = /* html */`
	<div class="profile-card">
		<nav class="my-5 flex justify-center">
			<h1>All players</h1>
		</nav>
		<main class="relative flex w-full min-h-0 flex-1 flex-col gap-5 items-center">
			<div class="w-full flex justify-center">
				<div class="flex gap-4 items-center w-full max-w-md">
					<input class="form-input flex-1 h-8 px-4 py-2 rounded-md bg-slate-200 border-1 border-green-500" name="search-query" placeholder="search players">
				</div>
			</div>
			
			<ul style="max-height: calc(100vh - 250px);" class="grid gap-4 w-full grid-cols-[repeat(auto-fit,minmax(250px,1fr))] players-list overflow-y-auto">
			</ul>
		</main>
	</div>
`;
	document.querySelector('#app')!.innerHTML = template;

	const playersList = document.querySelector("ul.players-list")
	const inputQueryEl: HTMLInputElement = document.querySelector(`input[name="search-query"]`)!

	let requestPage = 1;
	let requestSize = 30;
	let lastQuery = ""
	let canFetchMore = false;


	if (inputQueryEl) {
		inputQueryEl.focus();
	}

	const postRequestUpdate = (updateMode: UIUpdateMode) =>
		(query: string, data: { users?: PossibleFriendUser[] }) => {
			if (data.users) {
				if (query !== lastQuery) {
					requestPage = 1
					lastQuery = query
				}
				else {
					requestPage++
				}
				canFetchMore = data.users.length === requestSize
				updateUsersList(data.users, updateMode)
			}
		}

	const updateUsersList = (users: PossibleFriendUser[], uiUpdateMode: UIUpdateMode = "replace") => {
		if (!playersList) {
			console.warn("Players list not found")
			return
		}
		let playersListTemplate = ""
		users.forEach(u => {
			playersListTemplate += getPlayerLi(u)
		});
		if (uiUpdateMode === "append") {
			playersList.innerHTML += playersListTemplate
		} else if (uiUpdateMode === "replace") {
			playersList.innerHTML = playersListTemplate
		}
	}

	const handleInput = debounce((value: string) => {
		value = value.trim()

		console.log("Debounce Fetch users with query", value, "page", requestPage, "size", requestSize)
		fetchUsers(value, requestPage, requestSize, postRequestUpdate("replace"))

	}, 300);

	const handleInputChange = (ev: Event) => {
		const target = ev.target as HTMLSelectElement | HTMLInputElement;

		if (target) {
			if (lastQuery !== target.value) {
				requestPage = 1
				lastQuery = target.value
			}
			handleInput(target.value)
		}
	}

	const handleScroll = () => {
		if (!playersList || !canFetchMore) return;

		const { scrollTop, scrollHeight, clientHeight } = playersList;

		if (scrollTop + clientHeight >= scrollHeight - 50) {
			fetchUsers(inputQueryEl.value.trim(), requestPage, requestSize, postRequestUpdate("append"));
		}
	};

	inputQueryEl.addEventListener("input", handleInputChange)

	playersList?.addEventListener("scroll", handleScroll);

	fetchUsers(lastQuery.trim(), requestPage, requestSize, postRequestUpdate("replace"));

	return () => {
		inputQueryEl.removeEventListener("input", handleInputChange)
		playersList?.removeEventListener("scroll", handleScroll);
	}
}

Router.getInstance().register({ path: '/players', guards: [authGuard], component });
