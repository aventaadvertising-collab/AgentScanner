import { AuthProvider } from "@/lib/AuthContext";

export const metadata = {
  title: "AgentScreener — The Intelligence Layer for AI Products",
  description: "Real-time metrics, funding data, GitHub activity, and traction signals on 155+ AI startups, agents, and tools. The terminal VCs and builders use.",
  openGraph: {
    title: "AgentScreener",
    description: "Track the entire AI ecosystem. Real-time metrics on 155+ products across 28 categories.",
    siteName: "AgentScreener",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentScreener — AI Product Intelligence",
    description: "Real-time metrics, funding data, and traction signals on every AI product getting traction.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#F4F5F7" }}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
