export const metadata = {
  title: "AI Screener — AgentScreener",
  description:
    "Real-time detection of new AI products, agents, models, and tools as they launch. Powered by AgentScreener Intelligence.",
  openGraph: {
    title: "AI Screener — AgentScreener",
    description:
      "Real-time detection of new AI products, agents, models, and tools as they launch. Powered by AgentScreener Intelligence.",
    type: "website",
    siteName: "AgentScreener",
  },
  twitter: {
    card: "summary",
    title: "AI Screener — AgentScreener",
    description:
      "Real-time detection of new AI products, agents, models, and tools as they launch.",
  },
};

import ScreenerClient from "./ScreenerClient";

export default function ScreenerPage() {
  return <ScreenerClient />;
}
