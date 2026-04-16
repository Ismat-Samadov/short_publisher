import Sidebar from '@/app/components/Sidebar';
import MobileNav from '@/app/components/MobileNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile top bar + drawer */}
      <MobileNav />

      <main className="flex-1 lg:ml-[220px] min-h-screen">
        {/* Subtle dot grid background */}
        <div className="fixed inset-0 lg:ml-[220px] dot-grid opacity-[0.35] pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-8 pt-20 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
