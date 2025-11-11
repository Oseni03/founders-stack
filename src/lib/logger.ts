/* eslint-disable @typescript-eslint/no-explicit-any */
/* Lightweight structured logger used across webhook routes and server code */
type Meta = Record<string, any> | undefined;

const LEVELS: Record<string, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
};

const envLevel = process.env.LOG_LEVEL || "info";
const currentLevel = LEVELS[envLevel] ?? LEVELS.info;

function formatMeta(meta?: Meta) {
	if (!meta) return undefined;
	try {
		return JSON.parse(
			JSON.stringify(meta, (_key, value) => {
				// Serialize Error objects
				if (value instanceof Error) {
					return { message: value.message, stack: value.stack };
				}
				return value;
			})
		);
	} catch {
		return { meta: String(meta) };
	}
}

function log(level: keyof typeof LEVELS, message: string, meta?: Meta) {
	if (LEVELS[level] < currentLevel) return;

	const payload = {
		ts: new Date().toISOString(),
		level,
		message,
		meta: formatMeta(meta) ?? undefined,
	} as Record<string, any>;

	// Print compact JSON for structured logs
	// Keep synchronous to preserve ordering in serverless environments
	// eslint-disable-next-line no-console
	console.log(JSON.stringify(payload));
}

export const logger = {
	debug: (msg: string, meta?: Meta) => log("debug", msg, meta),
	info: (msg: string, meta?: Meta) => log("info", msg, meta),
	warn: (msg: string, meta?: Meta) => log("warn", msg, meta),
	error: (msg: string, meta?: Meta) => log("error", msg, meta),
};

export default logger;
