// lib/utils/date.ts
export function formatDate(
	date: string | Date | number | null | undefined,
	short: boolean = false
): string {
	if (!date) return "N/A";

	try {
		let dateObj: Date;

		if (date instanceof Date) {
			dateObj = date;
		} else if (typeof date === "string" || typeof date === "number") {
			dateObj = new Date(date);
		} else {
			return "N/A";
		}

		if (isNaN(dateObj.getTime())) {
			return "N/A";
		}
		if (short) {
			return dateObj.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
			});
		}
		return dateObj.toLocaleDateString();
	} catch (error) {
		console.error("[DATE_FORMAT_ERROR]", error);
		return "N/A";
	}
}
