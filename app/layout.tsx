import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Providers from "./Providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cinema Paradiso",
  description: "Discover and explore cinema and television masterworks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfairDisplay.variable} dark`}
      style={{ backgroundColor: "#07070b" }}
    >
      <body
        className="min-h-screen text-gray-100 antialiased"
        style={{
          backgroundColor: "#07070b",
          fontFamily: "var(--font-inter), sans-serif",
        }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
