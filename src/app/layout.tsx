import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "QTrack — QSTP Asset Intelligence",
  description:
    "Live asset and furniture tracking for Qatar Science & Technology Park.",
};

// Runs before React hydrates so the initial paint matches the stored theme — no flash.
const themeBootstrap = `
(function () {
  try {
    var t = localStorage.getItem("qtrack-theme");
    if (t !== "light" && t !== "dark") t = "light";
    document.documentElement.setAttribute("data-theme", t);
  } catch (_) {
    document.documentElement.setAttribute("data-theme", "light");
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <Nav />
          <main className="flex-1 w-full max-w-[1500px] mx-auto px-4 sm:px-6 py-6">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
