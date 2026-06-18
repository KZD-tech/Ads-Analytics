import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ad Analytics Dashboard",
  description: "Analisis prestasi iklan Meta & Google Ads",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ms" className={inter.className}>
      <body className="bg-bg text-text-primary min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}