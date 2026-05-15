import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora, Outfit } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const brandSerif = Lora({
  variable: "--font-brand-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const brandDisplay = Outfit({
  variable: "--font-brand-display",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

export const metadata: Metadata = {
  title: "InfoPix — Nightingale Theme",
  description:
    "A guided infographic generator with adaptive light/dark theming inspired by Nightingale.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${brandSerif.variable} ${brandDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
