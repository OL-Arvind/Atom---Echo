import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import { NavigationProgressBar } from "@/components/layout/navigation-progress-bar";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display-manrope",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#10110f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Atom & Echo",
  description: "Atom & Echo Agency Operating System",
  icons: {
    icon: [
      { url: "/icon.svg?v=20260925", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg?v=20260925",
    apple: "/icon.svg?v=20260925",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "A&E Review",
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
      data-theme="light"
      suppressHydrationWarning
      className={`${dmSans.variable} ${manrope.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("ae_theme")||"light";document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`,
          }}
        />
        <link rel="icon" type="image/svg+xml" href="/icon.svg?v=20260925" />
        <link rel="shortcut icon" href="/icon.svg?v=20260925" />
        <link rel="apple-touch-icon" href="/icon.svg?v=20260925" />
      </head>
      <body className={`${dmSans.className} font-sans`}>
        <Suspense fallback={null}>
          <NavigationProgressBar />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
