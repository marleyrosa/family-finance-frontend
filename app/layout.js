import { Manrope, Sora } from "next/font/google";

import "./globals.css";
import PwaRegister from "../components/PwaRegister";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });

export const metadata = {
  title: "FamilYMoney",
  description: "Plataforma de gestao financeira familiar",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
};

export const viewport = {
  themeColor: "#070c12",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`${manrope.variable} ${sora.variable} bg-halo font-body text-text`}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
