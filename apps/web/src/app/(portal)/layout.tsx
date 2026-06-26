import { AppSidebar } from "@/components/AppSidebar";
import { MockSessionProvider } from "@/components/MockSessionContext";
import { Topbar } from "@/components/Topbar";

export default function PortalLayout({
 children
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <MockSessionProvider>
 <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-transparent">
 <AppSidebar />
 <div className="min-w-0 max-w-full lg:pl-64">
 <Topbar />
 <main className="mx-auto flex w-full min-w-0 max-w-[1480px] flex-col gap-5 overflow-x-hidden px-4 py-5 sm:px-5 lg:px-6">
 {children}
 </main>
 </div>
 </div>
 </MockSessionProvider>
 );
}
