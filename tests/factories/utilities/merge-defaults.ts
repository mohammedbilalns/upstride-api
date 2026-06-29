export function mergeDefaults<T>(defaults: T, overrides?: Partial<T>): T {
	return {
		...defaults,
		...overrides,
	};
}
