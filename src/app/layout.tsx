import type { Metadata } from "next";
import "./globals.css";
import { Header } from "./components/header";

export const metadata: Metadata = {
  title: "Sistema de Carregamento",
  description: "Gestor de administração de operações Logísticas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body className={`antialiased`}
        >
        <Header /> 
        {children}
      </body>
    </html>
  );
}
