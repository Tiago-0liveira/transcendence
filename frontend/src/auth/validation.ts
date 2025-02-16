
export const isValidLoginFormData = (_data: FormData): boolean => {

	const username_entry = _data.get("username");
	const password_entry = _data.get("password");
	if (!username_entry || !password_entry) { return false; }
	const username = username_entry.toString()
	const password = password_entry.toString()
	//TODO: add more specific validation like big chars and small, numbers, all those things
	if (username.length < 5 || username.length > 17) { return false; }
	if (password.length < 8 || password.length > 25) { return false; }


	const displayName_entry = _data.get("displayName");
	/*const _avatarUrl_entry = _data.get("avatarUrl");*/

	if (displayName_entry) {
		const displayName = displayName_entry.toString();
		if (displayName.length < 4 || displayName.length > 17) { return false; }
		// TODO: we could remove curse or strong words (maybe install node js lib with dictionary ?? or just leave it like this)
	}

	return true;
}