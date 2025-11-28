// src/app/layout.js
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { Poppins, Baloo_2 } from "next/font/google";

export const metadata = {
  title: "La Pape",
  description: "Papelería creativa",
};

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-baloo",
});

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${poppins.variable} ${baloo.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
