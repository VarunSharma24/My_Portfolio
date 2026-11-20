"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LockKeyhole } from "lucide-react";
export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not sign in.");
      const prefix = process.env.NEXT_PUBLIC_ADMIN_ROUTE_PREFIX;
      router.replace(`/${prefix}/admin/edit`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <form className="login-form" onSubmit={submit}>
      <label>
        Email address
        <input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label>
        Password
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && (
        <p role="alert" className="admin-error">
          {error}
        </p>
      )}
      <button disabled={loading} className="button button-primary">
        {loading ? <LoaderCircle className="spin" size={16} /> : <LockKeyhole size={15} />} Sign in
      </button>
    </form>
  );
}
