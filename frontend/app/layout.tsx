import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "COGNET9 - SLM Fine-tuning Platform",
  description: "QLoRA-based Small Language Model Fine-tuning Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-20">{children}</main>
        </div>
      </body>
    </html>
  );
}
