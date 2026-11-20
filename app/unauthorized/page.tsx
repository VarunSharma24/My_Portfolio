import Link from "next/link";
export const metadata = { title: "Access denied", robots: { index: false, follow: false } };
export default function Unauthorized() {
  return (
    <main className="unauthorized">
      <div>
        <span className="eyebrow">403 · Forbidden</span>
        <h1>That account can’t access this area.</h1>
        <p>Use the authorized administrator account to continue.</p>
        <Link className="button" href="/">
          Return to portfolio
        </Link>
      </div>
    </main>
  );
}
