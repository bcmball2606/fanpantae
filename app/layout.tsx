import type { Metadata } from "next";
import { Noto_Sans_Thai, Orbitron } from "next/font/google";
import "./globals.css";

const notoThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "700", "900"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["700", "900"],
});

export const metadata: Metadata = {
  title: "แฟนพันธุ์แท้ GeoGuessr",
  description: "การแข่งขันแฟนพันธุ์แท้ออนไลน์ — GeoGuessr",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${notoThai.variable} ${orbitron.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="studio-bg" />
        {children}
      </body>
    </html>
  );
}
