import { Button } from "./button";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export const CopyButton = ({ text }: { text: string }) => {
	const [copied, setCopied] = useState(false);
	const copy = () => {
		navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};
	return (
		<Button size="icon" variant="outline" onClick={copy}>
			{copied ? (
				<Check className="h-4 w-4" />
			) : (
				<Copy className="h-4 w-4" />
			)}
		</Button>
	);
};
