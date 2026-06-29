import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "نظام درجات الطلاب",
  description: "نظام إدارة درجات الطلاب",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
