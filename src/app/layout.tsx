import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

// GeistSans is loaded from the geist npm package (Vercel's font)
// It maps to --font-geist-sans which is referenced by --font-display in @theme
const geistSans = GeistSans;

export const metadata: Metadata = {
  title: {
    default: "OSS Match — Find open-source issues that match your experience",
    template: "%s — OSS Match",
  },
  description:
    "Analyze your public GitHub activity to discover open-source issues that genuinely match your technology experience. Deterministic matching with transparent explanations.",
  keywords: [
    "open source",
    "github",
    "issues",
    "developer tools",
    "typescript",
    "nextjs",
    "contributions",
  ],
  authors: [{ name: "OSS Match contributors" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "OSS Match — Find open-source issues that match your experience",
    description:
      "Discover open-source issues matched to your GitHub technology footprint.",
    siteName: "OSS Match",
  },
  twitter: {
    card: "summary_large_image",
    title: "OSS Match",
    description: "Find open-source issues that match your experience.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
