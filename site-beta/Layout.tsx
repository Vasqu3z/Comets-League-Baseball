import type { Metadata } from "next";
import { Dela_Gothic_One, Chivo, Rajdhani, Space_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
import SidebarMobile from "@/components/SidebarMobile";

const delaGothic = Dela_Gothic_One({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const chivo = Chivo({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const rajdhani = Rajdhani({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-ui',
  display: 'swap',
});

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Comets League Baseball",
  description: "The premier Mario Super Sluggers analytics hub.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${delaGothic.variable} ${chivo.variable} ${rajdhani.variable} ${spaceMono.variable}`}>
      <body className="bg-background text-white min-h-screen flex flex-col md:flex-row overflow-x-hidden font-body">
        <div className="md:hidden z-50">
          <SidebarMobile />
        </div>
        <div className="hidden md:block w-64 shrink-0 h-screen sticky top-0 border-r border-white/10 bg-surface-dark/50 backdrop-blur-md z-40">
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0 relative">
          <Header />
          <main className="flex-1 relative z-0">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}