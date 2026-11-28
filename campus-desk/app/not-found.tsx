import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ maxWidth: 600, margin: "15vh auto", padding: 24 }}>
      <h1>Page not found</h1>
      <p>This page is unavailable.</p>
      <Link href="/dashboard">Back to dashboard</Link>
    </main>
  );
}
