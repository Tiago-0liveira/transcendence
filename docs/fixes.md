
## TODO

### Backend
	- [ ] check all endpoints for security breaches or things that aren't suppost to happen like someone trying to remove a friend that they don't have (things like this)
	- [x] on google oauth complete we should clear the http cookie used for completing the signUp

### Frontend
	- [x] in the auth middleware change from /user to the actual path the user wants to go to
	- [ ] in Auth Manager check for all auth requests that aren't using this.authFetch, because they should!
	- [ ] in Auth Manager authFetch instead of doing the request right away check at least if accessToken is valid especially for recovering the user on first page load (reduce 1 request)