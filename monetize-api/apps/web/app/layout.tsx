import type { ReactNode } from "react";

export const metadata = {
  title: "MonetizeAPI",
  description: "From endpoint to paid agent-ready tool",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: "2rem" }}>
        {children}
      </body>
    </html>
  );
}
