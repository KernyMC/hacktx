import type { Metadata } from "next";
import { Pixelify_Sans, VT323 } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const pixelify = Pixelify_Sans({
  variable: "--font-pixelify",
  subsets: ["latin"],
});

// Digits only: Pixelify Sans draws 5 exactly like S, so numbers come from Tiny5 (OFL, subset to 0-9).
const tiny5 = localFont({
  src: "../styles/fonts/Tiny5-digits.ttf",
  variable: "--font-digits",
  declarations: [{ prop: "unicode-range", value: "U+0030-0039" }],
  // No metric-matched fallback face: it would cover letters too and hide Pixelify Sans.
  adjustFontFallback: false,
});

const vt323 = VT323({
  variable: "--font-vt323",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Familiars",
  description: "A cozy pixel pet that grows when you do real-life quests.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${pixelify.variable} ${vt323.variable} ${tiny5.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
