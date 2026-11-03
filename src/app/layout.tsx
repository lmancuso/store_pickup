import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Store Pickup",
  description: "Pedí comida conversando y retirala en el local.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
