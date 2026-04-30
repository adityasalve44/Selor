import { CustomerTopNav, CustomerBottomNav } from "../components/layout/CustomerNav";
import { ErrorBoundary } from "../components/ErrorBoundary";

export default function BookLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <CustomerTopNav showBack />
      <div className="pt-4 pb-28">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </div>
      <CustomerBottomNav />
    </>
  );
}
