import { type Mocked, vi } from "vitest";

export function createMock<T>(): Mocked<T> {
	const mocks = new Map<PropertyKey, ReturnType<typeof vi.fn>>();

	return new Proxy({} as Mocked<T>, {
		get(_, property) {
			if (!mocks.has(property)) {
				mocks.set(property, vi.fn());
			}

			return mocks.get(property);
		},
	});
}
