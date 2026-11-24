import type { Metadata } from "next";
import "./globals.css";
import { ProgressProvider } from "@/lib/store/progressStore";
import { ThemeProvider, themeInitScript } from "@/lib/store/themeStore";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { SettingsProvider } from "@/lib/platform/settings";
import { ToastProvider } from "@/components/platform/Toast";

export const metadata: Metadata = {
  title: "Korean Center",
  description: "Korean Center o'quv markazi platformasi: kurslar, vazifalar, davomat, lug'at va natijalar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>
          <AuthProvider>
            <SettingsProvider>
              <ToastProvider>
                <ProgressProvider>{children}</ProgressProvider>
              </ToastProvider>
            </SettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
