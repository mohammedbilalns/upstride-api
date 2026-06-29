import type { Mocked } from "vitest";

export function createMock<T>(): Mocked<T> {
	return new Proxy(
		{},
		{
			get: () => {
				return vi.fn;
			},
		},
	) as Mocked<T>;
}
