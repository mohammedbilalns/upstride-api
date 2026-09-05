import type { LoginResponse } from "../../dtos";

export interface IDummyLoginUseCase {
	execute(): Promise<LoginResponse>;
}
