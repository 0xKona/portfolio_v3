import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { MainNavBar } from "@/components/navigation/main-nav-bar";
import { Footer } from "@/components/navigation/footer";
import { AuthProvider } from "@/components/auth/auth-provider";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Connor Robinson — Software Developer",
    template: "%s | Connor Robinson",
  },
  description:
    "Portfolio of Connor Robinson, a software developer specializing in full-stack development, cloud architecture, and modern web applications.",
  keywords: [
    "Connor Robinson",
    "software developer",
    "portfolio",
    "full-stack developer",
    "TypeScript",
    "React",
    "Next.js",
    "AWS",
  ],
  authors: [{ name: "Connor Robinson" }],
  creator: "Connor Robinson",
  metadataBase: new URL("https://konarobinson.com"),
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://konarobinson.com",
    siteName: "Connor Robinson — Portfolio",
    title: "Connor Robinson — Software Developer",
    description:
      "Portfolio of Connor Robinson, a software developer specializing in full-stack development, cloud architecture, and modern web applications.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${jetbrainsMono.variable} min-h-dvh font-mono bg-black text-neutral-300 antialiased flex flex-col`}
      >
        <AuthProvider>
          <MainNavBar />
          <div className="max-w-7xl mx-auto px-4 flex-1 w-full">
            {children}
          </div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
