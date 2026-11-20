import { requireAdmin } from "@/lib/auth/admin";
import { AdminManager } from "@/components/admin/admin-manager";
export const metadata = { title: "Content manager", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function AdminSection({ params }: { params: Promise<{ section: string }> }) {
  await requireAdmin();
  const { section } = await params;
  return <AdminManager section={section} />;
}
