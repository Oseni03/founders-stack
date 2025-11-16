import { prisma } from "@/lib/prisma";
import DesignDetail from "@/components/design/design-detail";

export default async function DesignDetailPage({
	params,
}: {
	params: Promise<{ productId: string; id: string }>;
}) {
	const { productId, id } = await params;
	const design = await prisma.designFile.findUnique({
		where: { id, organizationId: productId },
		include: {
			project: true,
			comments: {
				orderBy: { createdAt: "desc" },
				include: { author: true },
			},
			linkedItems: true,

			// Assume versions via metadata or separate model; use metadata for MVP
		},
	});

	if (!design) return <div>Not found</div>;

	return <DesignDetail initialDesign={design} />;
}
