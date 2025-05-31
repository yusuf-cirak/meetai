/** @format */

import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/modules/dashboard/ui/components/dashboard-sidebar";

interface Props {
	children: React.ReactNode;
}

export default function Layout({ children }: Props) {
	return (
		<SidebarProvider>
			<DashboardSidebar></DashboardSidebar>
			<main className="flex flex-col h-screen w-screen bg-muted">
				{children}
			</main>
		</SidebarProvider>
	);
}
