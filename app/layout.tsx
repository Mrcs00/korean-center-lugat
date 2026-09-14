import type { Metadata } from "next";
import "./globals.css";
import { ProgressProvider } from "@/lib/store/progressStore";
import { ThemeProvider, themeInitScript } from "@/lib/store/themeStore";

export const metadata: Metadata = {
  title: "Korean Center Lug'at",
  description: "TOPIK lug'atlarini yodlang, takrorlang va imtihonga tayyorlaning.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>
          <ProgressProvider>{children}</ProgressProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
