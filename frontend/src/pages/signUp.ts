import { isValidLoginFormData } from "@/auth/validation";
import Router from "@/router/Router";
import { decodeURIfromRoute } from "@/uri-encoding";

const component = async () => {
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
        <!--h5 class="text-xl text-center font-medium mb-4 text-gray-900">Sign Up</h5> -->
        <div class= "flex items-center justify-center">
        <img id="userAvatar" class="rounded-full w-32 h-32" src="42-logo.svg" alt="">
        </div>
        <div>
            <label for="email" class= "block mb-0.5 text-sm font-medium text-gray-900 ">Your email</label>
            <input type="email" name="email" id="email" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5" placeholder="name@company.com" required>
        </div>
        <div>
            <label for="username" class= "block mb-0.5 text-sm font-medium text-gray-900 ">Your username</label>
            <input type="username" name="username" id="username" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5" placeholder="name@company.com" required>
        </div>
        <div>
            <label for="password" class= "block mb-0.5 text-sm font-medium text-gray-900 ">Your password</label>
            <input type="password" name="password" id="password" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5" placeholder="***********" required>
        </div>
        <div class="flex items-start">
            <div class="flex items-start">
                <div class="flex items-center h-5">
                    <input id="remember" type="checkbox" value="" class="w-4 h-4 border border-gray-300 rounded-sm bg-gray-50 focus:ring-3 focus:ring-purple-500">
                </div>
                <label for="remember" class="ms-2 text-sm font-medium text-gray-900">Remember me</label>
            </div>
        </div>
        <button type="submit" class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-1 text-center" >Sign Up</button>
         <div class= "flex justify-center flex-row space-x-6">
             <div class= "border rounded-lg p-0.5 border-yellow-300">
                 <a href="#">
                     <span class="text-lg text-yellow-600 flex items-center">Sign Up w/ <img  class="w-7 h-7 rounded-full" src="google-logo.svg" alt=""></span>
                 </a>
             </div>
             <div class="border rounded-lg p-0.5 border-gray-700">
                 <a href="#"> 
                     <span class="text-lg flex items-center">Sign Up w/ <img  class="w-7 h-7 rounded-none" src="42-logo.svg" alt=""></span>
                 </a>
             </div> 
         </div>  
        </form>
    </div>
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

Router.getInstance().register({ path: "/signUp", component });
