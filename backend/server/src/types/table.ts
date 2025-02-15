

type DatabaseResult<T> =
	{ error?: Error, result: T } |
	{ error: Error, result?: T }
