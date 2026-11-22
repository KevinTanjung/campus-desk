import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Campus Desk", template: "%s | Campus Desk" },
  description: "Request a campus service and follow its progress.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
