import Sidebar from '@/app/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[220px] min-h-screen">
        {/* Subtle dot grid background */}
        <div className="fixed inset-0 ml-[220px] dot-grid opacity-[0.35] pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
