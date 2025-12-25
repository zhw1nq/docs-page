import { ThemeProvider } from "@/components/theme/ThemeProvider";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://docs.lunie.dev"),
  title: {
    default: "Lunaby Documentation",
    template: "%s | Lunaby Docs",
  },
  description:
    "Tài liệu hướng dẫn và API Reference của Lunaby. Khám phá các tính năng, hướng dẫn sử dụng và tài liệu kỹ thuật.",
  keywords: [
    "Documentation",
    "API",
    "Discord",
    "Community",
    "Hướng dẫn",
    "Tài liệu",
  ],
  authors: [{ name: "Lunaby" }],
  creator: "Lunaby",
  publisher: "Lunaby",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://docs.lunie.dev",
    siteName: "Lunaby Documentation",
    title: "Lunaby Documentation",
    description:
      "Tài liệu hướng dẫn và API Reference của Lunaby. Khám phá các tính năng, hướng dẫn sử dụng và tài liệu kỹ thuật.",
    images: [
      {
        url: "https://7-mau.com/api/discord/737687048147960000.png",
        width: 512,
        height: 512,
        alt: "Lunaby Documentation",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Lunaby Documentation",
    description:
      "Tài liệu hướng dẫn và API Reference của Lunaby.",
    images: ["https://7-mau.com/api/discord/737687048147960000.png"],
  },
  alternates: {
    canonical: "https://docs.lunie.dev",
  },
  other: {
    "theme-color": "#7c3aed",
    "color-scheme": "dark light",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
