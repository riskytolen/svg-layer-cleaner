import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SVG Layer Cleaner - Breakdown & Edit SVG Layers",
  description: "Upload, parse, and manage SVG layers with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
