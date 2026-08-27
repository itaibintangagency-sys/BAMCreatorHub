import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bintang Creator Hub",
  description: "Platform manajemen creator Shopee Affiliate — Bintang Agency",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-[#F5F5F5] text-ink text-sm">{children}</body>
    </html>
  );
}
