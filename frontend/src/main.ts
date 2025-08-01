import AuthManager from './auth/authManager'
import NavBar from './components/NavBar'
import Router from './router/Router'
import './style.css'
import "toastify-js/src/toastify.css"

import "@page/registry.ts"
import SocketHandler from './auth/socketHandler'

const b = document.getElementsByTagName("body").item(0)
if (!b) {
	throw new Error("Body Element not found!")
}
const navBar = new NavBar();
navBar.style.zIndex = "10000";
b.prepend(navBar)

Router.getInstance().initializeRouter();
AuthManager.getInstance();
SocketHandler.getInstance();