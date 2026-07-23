import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "11WINS | Player Agency",
  description: "Professional football player representation. Contract management, transfers, and career planning.",
  keywords: "football agency, player representation, 11WINS, Bundesliga, transfers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0f] text-[#e8e8e8] antialiased">
        {children}
      </body>
    </html>
  );
}