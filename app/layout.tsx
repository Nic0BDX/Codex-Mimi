import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Les Soirées de Mimi et Nini",
  description: "Nini, sa chérie et leurs soirées MÉGANOPOLY.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
