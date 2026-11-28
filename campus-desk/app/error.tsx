"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main style={{ maxWidth: 600, margin: "15vh auto", padding: 24 }}>
      <h1>We could not load Campus Desk.</h1>
      <p>The service may be unavailable. Please try again.</p>
      <button onClick={reset}>Try again</button>
    </main>
  );
}
