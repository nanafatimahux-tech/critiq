import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Newsreader } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const serif = Newsreader({ variable: "--font-serif-display", subsets: ["latin"], weight: ["400"], style: ["normal", "italic"] });
const mono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Critiq — Portfolio reviews from a hiring manager's point of view",
  description: "Evidence-based portfolio reviews for product and UX designers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${serif.variable} ${mono.variable} antialiased min-h-screen`}>{children}</body>
    </html>
  );
}
