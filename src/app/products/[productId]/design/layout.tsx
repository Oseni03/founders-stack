// app/design/layout.tsx
import { DesignStoreProvider } from "@/zustand/providers/design-store-provider";
import { ReactNode } from "react";

export default function DesignLayout({ children }: { children: ReactNode }) {
	return <DesignStoreProvider>{children}</DesignStoreProvider>;
}
