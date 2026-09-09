import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sức khỏe Y tế · 9 tháng–18 tuổi",
  description: "Web App độc lập theo dõi sức khỏe, phát triển, dinh dưỡng, vận động, chăm sóc và hồ sơ từ 9 tháng đến hết 18 tuổi.",
  applicationName: "Sức khỏe Y tế",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Sức khỏe Y tế", statusBarStyle: "default" },
  other: { "codex-preview": "development" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export const viewport = { themeColor: "#183f35" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
