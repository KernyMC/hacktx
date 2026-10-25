import type { Metadata } from "next";
import { Pixelify_Sans, VT323 } from "next/font/google";
import "./globals.css";

const pixelify = Pixelify_Sans({
  variable: "--font-pixelify",
  subsets: ["latin"],
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
      className={`${pixelify.variable} ${vt323.variable} h-full antialiased`}
    >
      <head>
        {/* Digits only: Pixelify Sans draws 5 exactly like S, so numbers come from Tiny5. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- root layout, so it loads on every page */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tiny5&text=0123456789&display=swap" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
