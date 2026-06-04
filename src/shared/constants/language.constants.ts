const MentorLanguageMap = {
	en: "English",
	hi: "Hindi",
	ar: "Arabic",
	fr: "French",
	es: "Spanish",
	de: "German",
	pt: "Portuguese",
	zh: "Chinese",
	ja: "Japanese",
	ko: "Korean",
} as const;

export const MentorLanguageCodes = Object.keys(MentorLanguageMap) as [
	keyof typeof MentorLanguageMap,
	...(keyof typeof MentorLanguageMap)[],
];
