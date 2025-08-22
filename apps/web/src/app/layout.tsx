import Link from "next/link";
import React from "react";

export const metadata = {
  title: "Civic App",
  description: "MVP civic app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "sans-serif" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid #eee",
            position: "sticky",
            top: 0,
            background: "#fff",
            zIndex: 10,
          }}
        >
          <Link
            href="/"
            style={{ fontWeight: 700, textDecoration: "none", color: "#111" }}
          >
            Civic App
          </Link>
          <nav style={{ display: "flex", gap: 12 }}>
            <Link
              href="/polls"
              style={{ textDecoration: "none", color: "#0366d6" }}
            >
              Polls
            </Link>
          </nav>
        </header>
        <main style={{ padding: "24px" }}>{children}</main>
      </body>
    </html>
  );
}
