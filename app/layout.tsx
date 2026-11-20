import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ZAssistant } from "@/components/assistant/z-assistant";

export const metadata: Metadata = {
  metadataBase: new URL("https://varun.sh"),
  icons: { icon: "/favicon.png" },
  title: {
    default: "Varun Sharma",
    template: "%s | Varun Sharma",
  },
  description:
    "The portfolio of Varun Sharma: ethical hacking and cybersecurity, software development, and AI and technology building.",
  openGraph: {
    title: "Varun Sharma — Personal Portfolio",
    description:
      "Ethical hacking, cybersecurity, software development, and AI and technology building.",
    type: "website",
    siteName: "Varun Sharma",
  },
  twitter: {
    card: "summary_large_image",
    title: "Varun Sharma — Personal Portfolio",
    description:
      "Ethical hacking, cybersecurity, software development, and AI and technology building.",
  },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: "#08090d", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
        <ZAssistant />
      </body>
    </html>
  );
}
