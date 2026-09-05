export function mergeDefaults<T>(
	defaults: Partial<T>,
	overrides?: Partial<T>,
): T {
	return {
		...defaults,
		...overrides,
	} as T;
}
