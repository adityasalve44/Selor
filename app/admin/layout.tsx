import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { AdminTopNav, AdminBottomNav, AdminSidebar } from "../components/layout/AdminNav";
import { ToastProvider } from "../components/Toast";
import { ErrorBoundary } from "../components/ErrorBoundary";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  
  if (!user || user.role !== 'admin') {
    redirect("/dashboard");
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-on-surface">
        <AdminSidebar />
        <AdminTopNav />
        
        {/* 
          lg:pl-72: Offset for fixed sidebar on large screens
          pt-20: Top offset for mobile header (hidden on desktop)
          pb-24: Bottom offset for mobile nav
        */}
        <div className="lg:pl-72 flex flex-col min-h-screen">
          <main className="flex-1 pt-20 lg:pt-8 pb-24 md:pb-8">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
        
        <AdminBottomNav />
      </div>
    </ToastProvider>
  );
}


