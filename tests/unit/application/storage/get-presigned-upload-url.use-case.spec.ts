import { beforeEach, describe, expect, it } from "vitest";
import type { GetPreSignedUploadUrlInput } from "../../../../src/application/modules/storage/dtos/get-presigned-upload-url.dto";
import { GetPreSignedUploadUrlUseCase } from "../../../../src/application/modules/storage/use-cases/get-presigned-upload-url.use-case";
import type { IIdGenerator } from "../../../../src/application/services/id-generator.service.interface";
import type { IStorageService } from "../../../../src/application/services/storage.service.interface";
import { createMock } from "../../../factories/utilities/create-mock";

describe("GetPreSignedUploadUrlUseCase", () => {
	let storageService: ReturnType<typeof createMock<IStorageService>>;
	let idGenerator: ReturnType<typeof createMock<IIdGenerator>>;
	let useCase: GetPreSignedUploadUrlUseCase;

	beforeEach(() => {
		storageService = createMock<IStorageService>();
		idGenerator = createMock<IIdGenerator>();

		useCase = new GetPreSignedUploadUrlUseCase(storageService, idGenerator);
	});

	const baseInput: GetPreSignedUploadUrlInput = {
		fileName: "test-image.png",
		mimetype: "image/png",
		category: "profile-picture",
	};

	const mockPresignedResponse = {
		url: "https://storage.example.com/upload",
		fields: {
			key: "profile-picture/abc123.png",
			policy: "policy",
			signature: "sig",
		},
	};

	it("should generate key with category, generated ID, and file extension", async () => {
		idGenerator.generate.mockReturnValue("generated-id-123");
		storageService.getPresignedPost.mockResolvedValue(mockPresignedResponse);

		await useCase.execute(baseInput);

		expect(idGenerator.generate).toHaveBeenCalled();
		expect(storageService.getPresignedPost).toHaveBeenCalledWith(
			"profile-picture/generated-id-123.png",
			"image/png",
		);
	});

	it("should handle file names without extension", async () => {
		const input: GetPreSignedUploadUrlInput = {
			...baseInput,
			fileName: "testfile",
		};
		idGenerator.generate.mockReturnValue("generated-id");
		storageService.getPresignedPost.mockResolvedValue(mockPresignedResponse);

		await useCase.execute(input);

		expect(storageService.getPresignedPost).toHaveBeenCalledWith(
			"profile-picture/generated-id.testfile",
			"image/png",
		);
	});

	it("should handle file names with multiple dots", async () => {
		const input: GetPreSignedUploadUrlInput = {
			...baseInput,
			fileName: "archive.tar.gz",
		};
		idGenerator.generate.mockReturnValue("generated-id");
		storageService.getPresignedPost.mockResolvedValue(mockPresignedResponse);

		await useCase.execute(input);

		expect(storageService.getPresignedPost).toHaveBeenCalledWith(
			"profile-picture/generated-id.gz",
			"image/png",
		);
	});

	it("should return url, fields, and key from storage service", async () => {
		idGenerator.generate.mockReturnValue("generated-id-123");
		storageService.getPresignedPost.mockResolvedValue(mockPresignedResponse);

		const result = await useCase.execute(baseInput);

		expect(result).toEqual({
			url: mockPresignedResponse.url,
			fields: mockPresignedResponse.fields,
			key: "profile-picture/generated-id-123.png",
		});
	});

	it("should work with all valid categories", async () => {
		const categories: GetPreSignedUploadUrlInput["category"][] = [
			"resume",
			"profile-picture",
			"chat-media",
			"article-featured-image",
		];

		for (const category of categories) {
			const input: GetPreSignedUploadUrlInput = { ...baseInput, category };
			idGenerator.generate.mockReturnValue("id-123");
			storageService.getPresignedPost.mockResolvedValue({
				...mockPresignedResponse,
				fields: {
					...mockPresignedResponse.fields,
					key: `${category}/id-123.png`,
				},
			});

			const result = await useCase.execute(input);

			expect(result.key).toBe(`${category}/id-123.png`);
		}
	});

	it("should propagate errors from storage service", async () => {
		idGenerator.generate.mockReturnValue("id-123");
		const error = new Error("Presigned URL generation failed");
		storageService.getPresignedPost.mockRejectedValue(error);

		await expect(useCase.execute(baseInput)).rejects.toThrow(
			"Presigned URL generation failed",
		);
	});
});
