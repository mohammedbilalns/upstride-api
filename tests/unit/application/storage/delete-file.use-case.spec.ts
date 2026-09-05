import { beforeEach, describe, expect, it } from "vitest";
import { DeleteFileUseCase } from "../../../../src/application/modules/storage/use-cases/delete-file.use-case";
import type { IStorageService } from "../../../../src/application/services/storage.service.interface";
import { createMock } from "../../../factories/utilities/create-mock";

describe("DeleteFileUseCase", () => {
	let storageService: ReturnType<typeof createMock<IStorageService>>;
	let useCase: DeleteFileUseCase;

	beforeEach(() => {
		storageService = createMock<IStorageService>();
		useCase = new DeleteFileUseCase(storageService);
	});

	it("should call storage service delete with the provided key", async () => {
		const key = "uploads/user-1/avatar.png";
		storageService.delete.mockResolvedValue(undefined);

		await useCase.execute(key);

		expect(storageService.delete).toHaveBeenCalledWith(key);
		expect(storageService.delete).toHaveBeenCalledTimes(1);
	});

	it("should propagate errors from storage service", async () => {
		const key = "uploads/user-1/avatar.png";
		const error = new Error("Delete failed: Not found");
		storageService.delete.mockRejectedValue(error);

		await expect(useCase.execute(key)).rejects.toThrow(
			"Delete failed: Not found",
		);
	});

	it("should handle empty key", async () => {
		storageService.delete.mockResolvedValue(undefined);

		await useCase.execute("");

		expect(storageService.delete).toHaveBeenCalledWith("");
	});
});
