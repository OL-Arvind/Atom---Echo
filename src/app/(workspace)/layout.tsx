import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-black text-white">
      <Sidebar />
      <div className="pl-64">
        <TopNav />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
