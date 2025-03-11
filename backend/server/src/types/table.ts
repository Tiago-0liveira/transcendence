type DatabaseResult<T> =
	{ result: T, error?: undefined } |
	{ error: Error, result?: undefined }
