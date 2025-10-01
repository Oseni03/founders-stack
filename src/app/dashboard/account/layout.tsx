export default function AccountLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <div className="container max-w-4xl mx-auto py-6">{children}</div>;
}
