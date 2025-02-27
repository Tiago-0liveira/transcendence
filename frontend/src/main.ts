import AuthManager from './auth/authManager'
import Router from './router/Router'
import './style.css'

import "@page/registry.ts"

Router.getInstance().initializeRouter()
AuthManager.getInstance()