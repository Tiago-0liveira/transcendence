
## TODO

### Backend
	- [ ] check all endpoints for security breaches or things that aren't suppost to happen like someone trying to remove a friend that they don't have (things like this)
	- [ ] on google oauth complete we should clear the http cookie used for completing the signUp

### Frontend
	- [ ] in the auth middleware change from /user to the actual path the user wants to go to
	- [ ] in Auth Manager check for all auth requests that aren't using this.authFetch, because they should!
