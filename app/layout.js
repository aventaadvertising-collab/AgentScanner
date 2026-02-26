export const metadata = {
  title: "AgentScreener — AI Product Intelligence",
  description: "Real-time metrics, verified data, and intelligence on every AI product and agent.",
  openGraph: {
    title: "AgentScreener",
    description: "Real-time intelligence on AI products and agents. Verified metrics.",
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
      <body style={{ margin: 0, padding: 0, background: "#06080C" }}>
        {children}
      </body>
    </html>
  );
}
