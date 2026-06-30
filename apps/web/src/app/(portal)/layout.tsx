import { AppSidebar } from "@/components/AppSidebar";
import { AuthGate } from "@/components/AuthGate";
import { MockSessionProvider } from "@/components/MockSessionContext";
import { Topbar } from "@/components/Topbar";

export default function PortalLayout({
 children
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <MockSessionProvider>
 <AuthGate>
 <div className="min-h-screen w-full overflow-x-auto bg-transparent">
 <AppSidebar />
 <div className="min-w-0 lg:pl-64">
 <Topbar />
 <main className="mx-auto flex w-full min-w-0 max-w-none flex-col gap-5 overflow-visible px-4 py-5 sm:px-5 lg:px-6">
 {children}
 </main>
 </div>
 </div>
 </AuthGate>
 </MockSessionProvider>
 );
}
