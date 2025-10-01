import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

const Page = () => {
	return (
		<div className="p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-foreground">
						Stacks
					</h1>
					<p className="text-muted-foreground">Simple description</p>
				</div>
				<Button className="gap-2">
					<Plus className="w-4 h-4" />
					New
				</Button>
			</div>

			{/* Search */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
				<Input placeholder="Search notes..." className="pl-10" />
			</div>

			<div className="text-center py-12">
				<p className="text-muted-foreground">
					{"No stacks yet. Add your first stack!"}
				</p>
			</div>
		</div>
	);
};

export default Page;
