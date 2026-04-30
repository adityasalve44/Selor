import { CustomerTopNav, CustomerBottomNav } from "../components/layout/CustomerNav";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <CustomerTopNav />
      <div className="pt-4 pb-24">
        {children}
      </div>
      <CustomerBottomNav />
    </>
  );
}
