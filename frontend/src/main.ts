import AuthManager from './auth/authManager'
import NavBar from './components/NavBar'
import Router from './router/Router'
import './style.css'
import "toastify-js/src/toastify.css"

import "@page/registry.ts"

const b = document.getElementsByTagName("body").item(0)
if (!b) {
	throw new Error("Body Element not found!")
}
b.prepend(new NavBar())

Router.getInstance().initializeRouter()
AuthManager.getInstance()