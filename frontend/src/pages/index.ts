import AuthManager from "@/auth/authManager";
import Router from "@/router/Router";

const component = async () => {

	const loggedIn = Boolean(AuthManager.getInstance().User);

	const userElement = loggedIn ?
		"<a href=\"/user\">My User</a><a href=\"/logout\">Logout</a>" :
		"<a href=\"/login\">Login</a>"

	const template = `
    <nav class="bg-blue-600 text-white p-4 shadow-md">
        <div class="container mx-auto flex justify-between items-center">
            <a href="/" class="text-xl font-bold hover:text-purple-400">Transcendence</a>
            <div class="space-x-4">
                <a href="/login" class="hover:text-purple-400">Sign In</a>
                <a href="/signUp" class="hover:text-purple-400">Sign Up</a>
            </div>
        </div>
    </nav>
    <div class="flex items-center justify-center min-h-screen"> <!-- Added padding for better spacing -->
       <span class="px-4 py-4 bg-blue-600 rounded-lg shadow-2xl  hover:text-purple-400 text-white">
           ${userElement}
       </span>
    </div>
	`;
	document.querySelector("#app")!.innerHTML = template;
};

Router.getInstance().register({ path: "/", component });
