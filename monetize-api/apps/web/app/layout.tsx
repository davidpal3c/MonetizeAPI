import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";

import { AppFooter } from "./components/AppFooter";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata = {
  title: "MonetizeAPI",
  description: "From endpoint to paid agent-ready tool",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body>
        <div className="demo-shell">
          {children}
          <AppFooter />
        </div>
      </body>
    </html>
  );
}
