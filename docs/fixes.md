
## TODO

### Backend
	- [x] check all endpoints for security breaches or things that aren't suppost to happen like someone trying to remove a friend that they don't have (things like this)
	- [x] on google oauth complete we should clear the http cookie used for completing the signUp
	- [ ] implement 42 oauth

### Frontend
	- [x] in the auth middleware change from /user to the actual path the user wants to go to
	- [x] in Auth Manager authFetch instead of doing the request right away check at least if accessToken is valid especially for recovering the user on first page load (reduce 1 request)
	- [x] replace tailwind script tag with actual library loading with something like postCSS plugin
	- [x] look at all pages and check if we are removing the event listeners
	- [ ] replace google oauth script tag loader with actual library


### Both
	- [ ] use remember option on login and signin forms or just delete it