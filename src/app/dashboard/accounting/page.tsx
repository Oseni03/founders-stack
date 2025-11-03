import ComingSoonCategoryPage from "@/components/coming-soon-category";
import { DollarSign } from "lucide-react";

export default function AccountingComingSoonPage() {
	return (
		<ComingSoonCategoryPage
			category="Accounting"
			description="Our upcoming accounting tools will simplify financial management for founders and solopreneurs, so you can focus on growing your business."
			icon={DollarSign}
		/>
	);
}
