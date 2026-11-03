import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Store Pickup",
  description:
    "Pedí comida conversando, mirá en el mapa el local más cercano y retiralo con tu código de pedido.",
  applicationName: "Store Pickup",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#312e81",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" className="h-full antialiased">
      <body className="min-h-full flex flex-col overflow-x-hidden">{children}</body>
    </html>
  );
}
