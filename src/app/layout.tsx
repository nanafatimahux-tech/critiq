import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], weight: ["700", "800", "900"] });

export const metadata: Metadata = {
  title: "Critiq — Portfolio reviews from a hiring manager's point of view",
  description: "Evidence-based portfolio reviews for product and UX designers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${nunito.variable} antialiased min-h-screen`}>{children}</body>
    </html>
  );
}
