type DatabaseResult<T> =
	{ result: T, error: null } |
	{ error: Error, result: null }
