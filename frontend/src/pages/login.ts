import { isValidLoginFormData } from "@/auth/validation";
import Router from "@/router/Router";
import { decodeURIfromRoute } from "@/uri-encoding";

const component = async () => {
	const template = `
		<style>
			div.login form#loginForm div.input-wrapper {
				box-shadow: 5px 5px 10px -1px rgba(80,80,80,0.51);
				-webkit-box-shadow: 5px 5px 10px -1px rgba(80,80,80,0.51);
				-moz-box-shadow: 5px 5px 10px -1px rgba(80,80,80,0.51);
			}
			div.login form#loginForm div.input-wrapper a.oauth {
				box-shadow: 2px 2px 10px -1px rgba(80,80,80,0.51);
				-webkit-box-shadow: 2px 2px 10px -1px rgba(80,80,80,0.51);
				-moz-box-shadow: 2px 2px 10px -1px rgba(80,80,80,0.51);
			}
		</style>

		<div class="login p-20 pb-30">
			<form id="loginForm" class="flex flex-col justify-around items-center min-w-full min-h-full">
				<h1 class="font-medium">Login</h1>
				<div class="input-wrapper flex flex-col relative rounded-xl border-2 border-[rgb(80,80,80)] items-center justify-around min-w-sm max-w-120 min-h-110 max-h-140">
					<div class="inputs flex flex-col min-h-[80%]">
						<div class="flex flex-col mt-2 min-w-50 max-w-90">
							<label for="username" class="ml-1 text-left">Username</label>
							<input type="text" name="username" for="username" placeholder="Username" required minlength="5" maxlength="100"/>
						</div>
						<div class="flex flex-col mt-2 min-w-50 max-w-90">
							<label for="password" class="ml-1 text-left">Password</label>
							<input type="password" name="password" for="password" placeholder="Password" 
								required minlength="8" maxlength="100"
								class="TODO: this is commented this is a pattern that checks all it says below -->  pattern=\"(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,}\""
								title="At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character"
								onpaste="return false;"
							/>
						</div>
					</div>
					<button class="w-40">Sign In</button>
					<a href="/42-oauth" class="42 oauth absolute right-[-5rem] mb-[3.5rem]"><img class="aspect-auto w-8" src="42-logo.svg" alt="42 school logo svg"></a>
					<a href="/google-oauth" class="google oauth absolute right-[-5rem] mt-[3.5rem]"><img class="aspect-auto w-8" src="google-logo.svg" alt="Google logo svg"></a>
				</div>
			</form>
		</div>
	`;
	document.querySelector("#app")!.innerHTML = template;

	const form = document.getElementById("loginForm");
	if (!form) return;

	form.addEventListener("submit", async (e) => {
		e.preventDefault();
		const data = new FormData(form as HTMLFormElement);
		// TODO: change this login form (needs validation here and in the backend)
		// TODO: just some tests and boilerplate code
		if (isValidLoginFormData(data)) {
			// TODO: validate in backend
			// TODO: maybe send a notification here?
			const username = data.get("username")?.toString() ?? "";
			const password = data.get("password")?.toString() ?? "";
			const displayName = data.get("displayName")?.toString() ?? "";
			const avatarURL = data.get("avatarUrl")?.toString() ?? "";

			fetch("http://localhost:4000/user", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ username, password, displayName, avatarURL }),
			})
				.then((response) => {
					if (response.status !== 200) return;
					return response.json();
				})
				.then((data) => {
					console.log(data);
					fetch(`http://localhost:4000/user/${data.message}`)
						.then((response) => response.json())
						.then(({ message }) => {
							console.log(message);
							window.user = message;
							Router.getInstance().navigate("/user");
						});
				})
				.catch(console.error);
			/*window.user = { username };
			const route = Router.getInstance().getCurrentRoute();
			if (!route) {
				console.error("route is null");
			}
			else {
				try {
					const redirectUri = decodeURIfromRoute(route);
					console.log(redirectUri);
					Router.getInstance().navigate(redirectUri);

				} catch (error) {
					console.error(error);
				}
			}*/
		}
	});
};

Router.getInstance().register({ path: "/login", component });
