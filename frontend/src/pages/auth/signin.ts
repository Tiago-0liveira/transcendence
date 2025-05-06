import { isValidLoginFormData } from "@/auth/validation";
import Router from "@/router/Router";
import AuthManager from "@/auth/authManager"
import { decodeURIfromRoute } from "@/uri-encoding";
import { BACKEND_URL } from "@/utils/config";
import { backendEndpoint, normalizePath } from "@/utils/path";

const component = async () => {
<<<<<<<< HEAD:frontend/src/pages/auth/signin.ts
	const template = `
		<style>
			div.signin form#signinForm div.input-wrapper {
				box-shadow: 5px 5px 10px -1px rgba(80,80,80,0.51);
				-webkit-box-shadow: 5px 5px 10px -1px rgba(80,80,80,0.51);
				-moz-box-shadow: 5px 5px 10px -1px rgba(80,80,80,0.51);
			}
			div.signin form#signinForm div.input-wrapper a.oauth {
				box-shadow: 2px 2px 10px -1px rgba(80,80,80,0.51);
				-webkit-box-shadow: 2px 2px 10px -1px rgba(80,80,80,0.51);
				-moz-box-shadow: 2px 2px 10px -1px rgba(80,80,80,0.51);
			}
		</style>

		<div class="signin p-20 pb-30">
			<form id="signinForm" class="flex flex-col justify-around items-center min-w-full min-h-full">
				<h1 class="font-medium">Signin</h1>
				<div class="input-wrapper flex flex-col relative rounded-xl border-2 border-[rgb(80,80,80)] items-center justify-around min-w-sm max-w-120 min-h-110 max-h-140">
					<div class="inputs flex flex-col min-h-[80%]">
						<div class="flex flex-col mt-2 min-w-50 max-w-90">
							<label for="username" class="ml-1 text-left">Username</label>
							<input type="text" id="username" name="username" for="username" placeholder="Username" required minlength="5" maxlength="100"/>
						</div>
						<div class="flex flex-col mt-2 min-w-50 max-w-90">
							<label for="password" class="ml-1 text-left">Password</label>
							<input type="password" id="password" name="password" for="password" placeholder="Password" 
								required minlength="8" maxlength="100"
								class="TODO: this is commented this is a pattern that checks all it says below -->  pattern=\"(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,}\""
								title="At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character"
								onpaste="return false;"
							/>
						</div>
						<div class="flex flex-col mt-2 min-w-50 max-w-90">
							<label for="displayName" class="ml-1 text-left">Display Name</label>
							<input type="text" name="displayName" id="displayName" for="displayName" placeholder="Display Name" />
						</div>
						<div class="flex flex-col mt-2 min-w-50 max-w-90">
							<label for="avatarUrl" class="ml-1 text-left">Avatar Url</label>
							<input type="url" name="avatarUrl" id="avatarUrl" for="avatarUrl" placeholder="Avatar Url" />
						</div>
					</div>
					<button class="w-40">Signin</button>
					<a href="/42-oauth" class="42 oauth absolute right-[-5rem] mb-[3.5rem]"><img class="aspect-auto w-8" src="42-logo.svg" alt="42 school logo svg"></a>
					<a href="/google-oauth" class="google oauth absolute right-[-5rem] mt-[3.5rem]"><img class="aspect-auto w-8" src="google-logo.svg" alt="Google logo svg"></a>
				</div>
			</form>
		</div>
========
=======
	const template = /* html */ `
    
    <nav class="bg-blue-600 text-white p-4 shadow-md">
        <div class="container mx-auto flex justify-between items-center">
            <a href="/" class="text-xl font-bold hover:text-purple-400">Transcendence</a>
            <div class="space-x-4">
                <a href="/login" class="hover:text-purple-400">Sign In</a>
                <a href="/signUp" class="hover:text-purple-400">Sign Up</a>
            </div>
        </div>
    </nav>
   <div class="flex items-center justify-center h-screen">
    <div class="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm">
        <form class=" p-6 space-y-6" action="#">
        <h5 class="text-xl text-center font-medium mb-4 text-gray-900">Sign In</h5>
        <div>
            <label for="email" class= "block mb-2 text-sm font-medium text-gray-900 ">Your email</label>
            <input type="email" name="email" id="email" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5" placeholder="name@company.com" required>
        </div>
        <div>
            <label for="password" class= "block mb-2 text-sm font-medium text-gray-900 ">Your password</label>
            <input type="password" name="password" id="password" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5" placeholder="***********" required>
        </div>
        <div class="flex items-start">
            <div class="flex items-start">
                <div class="flex items-center h-5">
                    <input id="remember" type="checkbox" value="" class="w-4 h-4 border border-gray-300 rounded-sm bg-gray-50 focus:ring-3 focus:ring-purple-500">
                </div>
                <label for="remember" class="ms-2 text-sm font-medium text-gray-900">Remember me</label>
            </div>
                <a href="#" class="ms-auto text-sm text-blue-700 hover:underline">Lost password</a>
        </div>
        <button type="submit" class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-1 text-center" >Sign In</button>
         <div class= "flex justify-center flex-row space-x-6">
             <div class= "border rounded-lg p-0.5 border-yellow-300">
                 <a href="#">
                     <span class="text-lg text-yellow-600 flex items-center">Sign In w/ <img  class="w-7 h-7 rounded-full" src="google-logo.svg" alt=""></span>
                 </a>
             </div>
             <div class="border rounded-lg p-0.5 border-gray-700">
                 <a href="#"> 
                     <span class="text-lg flex items-center">Sign In w/ <img  class="w-7 h-7 rounded-none" src="42-logo.svg" alt=""></span>
                 </a>
             </div> 
         </div>  
        <div class="text-sm font-medium text-gray-500 dark:text-gray-300">
            Not registered? <a href="#" class="text-blue-700 hover:underline dark:text-blue-500">Create account</a>
        </div>
        </form>
    </div>
    </div> 
>>>>>>>> components:frontend/src/pages/login.ts
	`;
	document.querySelector("#app")!.innerHTML = template;

<<<<<<<< HEAD:frontend/src/pages/auth/signin.ts
	const form = document.getElementById("signinForm")
========
	const form = document.getElementById("loginForm");
>>>>>>>> components:frontend/src/pages/login.ts
	const template = `
		<style>
			div.signin form#signinForm div.input-wrapper {
				box-shadow: 5px 5px 10px -1px rgba(80,80,80,0.51);
				-webkit-box-shadow: 5px 5px 10px -1px rgba(80,80,80,0.51);
				-moz-box-shadow: 5px 5px 10px -1px rgba(80,80,80,0.51);
			}
			div.signin form#signinForm div.input-wrapper a.oauth {
				box-shadow: 2px 2px 10px -1px rgba(80,80,80,0.51);
				-webkit-box-shadow: 2px 2px 10px -1px rgba(80,80,80,0.51);
				-moz-box-shadow: 2px 2px 10px -1px rgba(80,80,80,0.51);
			}
		</style>

		<div class="signin p-20 pb-30">
			<form id="signinForm" class="flex flex-col justify-around items-center min-w-full min-h-full">
				<h1 class="font-medium">Signin</h1>
				<div class="input-wrapper flex flex-col relative rounded-xl border-2 border-[rgb(80,80,80)] items-center justify-around min-w-sm max-w-120 min-h-110 max-h-140">
					<div class="inputs flex flex-col min-h-[80%]">
						<div class="flex flex-col mt-2 min-w-50 max-w-90">
							<label for="username" class="ml-1 text-left">Username</label>
							<input type="text" id="username" name="username" for="username" placeholder="Username" required minlength="5" maxlength="100"/>
						</div>
						<div class="flex flex-col mt-2 min-w-50 max-w-90">
							<label for="password" class="ml-1 text-left">Password</label>
							<input type="password" id="password" name="password" for="password" placeholder="Password" 
								required minlength="8" maxlength="100"
								class="TODO: this is commented this is a pattern that checks all it says below -->  pattern=\"(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,}\""
								title="At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character"
								onpaste="return false;"
							/>
						</div>
						<div class="flex flex-col mt-2 min-w-50 max-w-90">
							<label for="displayName" class="ml-1 text-left">Display Name</label>
							<input type="text" name="displayName" id="displayName" for="displayName" placeholder="Display Name" />
						</div>
						<div class="flex flex-col mt-2 min-w-50 max-w-90">
							<label for="avatarUrl" class="ml-1 text-left">Avatar Url</label>
							<input type="url" name="avatarUrl" id="avatarUrl" for="avatarUrl" placeholder="Avatar Url" />
						</div>
					</div>
					<button class="w-40">Signin</button>
					<a href="/42-oauth" class="42 oauth absolute right-[-5rem] mb-[3.5rem]"><img class="aspect-auto w-8" src="42-logo.svg" alt="42 school logo svg"></a>
					<a href="/google-oauth" class="google oauth absolute right-[-5rem] mt-[3.5rem]"><img class="aspect-auto w-8" src="google-logo.svg" alt="Google logo svg"></a>
				</div>
			</form>
		</div>
	`;
	document.querySelector("#app")!.innerHTML = template;

	const form = document.getElementById("loginForm");
	const form = document.getElementById("signinForm")
	if (!form) return;

	form.addEventListener("submit", async (e) => {
		e.preventDefault();
		const data = new FormData(form as HTMLFormElement);
		// TODO: change this login form (needs validation here and in the backend)
		// TODO: just some tests and boilerplate code
<<<<<<<< HEAD:frontend/src/pages/auth/signin.ts
		if (isValidLoginFormData(data)) {
			// TODO: validate in backend 
			// TODO: maybe send a notification here?
			const username = data.get("username")?.toString() ?? "";
			const password = data.get("password")?.toString() ?? "";
			const displayName = data.get("displayName")?.toString() ?? "";
			const avatarUrl = data.get("avatarUrl")?.toString() ?? "";

			const payload: UserParams = { username, password };
			if (displayName) payload["displayName"] = displayName;
			if (avatarUrl) payload["avatarUrl"] = avatarUrl;

			const res = await AuthManager.getInstance().register(payload);
			if (res) {
				Router.getInstance().navigate("/login");
			} else {
				console.error("Sigin failed");
			}
			/*window.user = { username };
========
=======
		// if (isValidLoginFormData(data)) {
		// 	// TODO: validate in backend
		// 	// TODO: maybe send a notification here?
		// 	const username = data.get("username")?.toString() ?? "";
		// 	const password = data.get("password")?.toString() ?? "";
		// 	const displayName = data.get("displayName")?.toString() ?? "";
		// 	const avatarURL = data.get("avatarUrl")?.toString() ?? "";

		// 	fetch("http://localhost:4000/user", {
		// 		method: "POST",
		// 		headers: {
		// 			"Content-Type": "application/json",
		// 		},
		// 		body: JSON.stringify({ username, password, displayName, avatarURL }),
		// 	})
		// 		.then((response) => {
		// 			if (response.status !== 200) {
		// 				throw new Error(`Server responded with status ${response.status}`);
		// 			}
		// 			return response.json();
		// 		})
		// 		.then((data) => {
		// 			console.log(data);
		// 			if (!data || !data.message) {
		// 				throw new Error("Invalid response: missing message property");
		// 			}
		// 			fetch(`http://localhost:4000/user/${data.message}`)
		// 				.then((response) => response.json())
		// 				.then(({ message }) => {
		// 					console.log(message);
		// 					window.user = message;
		// 					Router.getInstance().navigate("/user");
		// 				});
		// 		})
		// 		.catch(console.error);
		window.user = {
			username: data.get("username")?.toString() ?? "test_user",
			displayName: data.get("displayName")?.toString() ?? "Test User",
			avatarUrl:
				data.get("avatarUrl")?.toString() ??
				"https://i.pinimg.com/originals/3f/1b/0c/3f1b0c4e2a8d7c5a9d3e5f5f5f5f5f5.jpg",
			/*
>>>>>>>> components:frontend/src/pages/login.ts
		if (isValidLoginFormData(data)) {
			// TODO: validate in backend 
			// TODO: maybe send a notification here?
			const username = data.get("username")?.toString() ?? "";
			const password = data.get("password")?.toString() ?? "";
			const displayName = data.get("displayName")?.toString() ?? "";
			const avatarUrl = data.get("avatarUrl")?.toString() ?? "";

			const payload: UserParams = { username, password };
			if (displayName) payload["displayName"] = displayName;
			if (avatarUrl) payload["avatarUrl"] = avatarUrl;

			const res = await AuthManager.getInstance().register(payload);
			if (res) {
				Router.getInstance().navigate("/login");
			} else {
				console.error("Sigin failed");
			}
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
		};
		Router.getInstance().navigate("/user");
	});
};

<<<<<<<< HEAD:frontend/src/pages/auth/signin.ts
Router.getInstance().register({ path: '/signin', component });
========
Router.getInstance().register({ path: "/login", component });
>>>>>>>> components:frontend/src/pages/login.ts
Router.getInstance().register({ path: "/login", component });
Router.getInstance().register({ path: '/signin', component });
