// app/design/page.tsx (Server Component for list view)
import { prisma } from "@/lib/prisma"; // Assume prisma setup in lib/prisma.ts
import DesignList from "@/components/design/design-list";

export default async function DesignPage({
	params,
}: {
	params: Promise<{ productId: string }>;
}) {
	const { productId } = await params;
	const designs = await prisma.designFile.findMany({
		where: { organizationId: productId },
		include: { project: true },
		orderBy: { updatedAt: "desc" },
	});

	// Fetch unique projects for filters
	const projects = await prisma.project.findMany({
		where: { organizationId: productId },
		select: { id: true, name: true },
	});

	return <DesignList initialDesigns={designs} initialProjects={projects} />;
}
