import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getServerEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/admin/login-form";
export const metadata = { title: "Administrator sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function AdminLogin() {
  const env = getServerEnv();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id === env.adminUserId) {
    const { data: member } = await supabase.rpc("is_portfolio_admin");
    if (member === true) redirect(`/${env.adminPrefix}/admin/edit`);
  }
  return (
    <main className="admin-login">
      <div className="login-box card">
        <Link className="admin-login-brand" href="/">
          <Image src="/favicon.png" alt="" width={40} height={40} priority />
          <span>Varun Sharma</span>
        </Link>
        <div className="login-icon">◇</div>
        <h1>Private workspace</h1>
        <p>Sign in with the authorized portfolio administrator account.</p>
        <LoginForm />
        <Link href="/" className="back-link">
          ← Back to portfolio
        </Link>
      </div>
    </main>
  );
}
