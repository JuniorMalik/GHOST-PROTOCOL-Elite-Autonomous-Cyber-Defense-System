import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GHOST-PROTOCOL | War Room",
  description: "Autonomous Cyber-Defense System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="overflow-hidden">
        <div className="scanline" />
        {children}
      </body>
    </html>
  );
}
