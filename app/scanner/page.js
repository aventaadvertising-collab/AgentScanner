export const metadata = {
  title: "AI Product Scanner — AgentScreener",
  description:
    "Real-time detection of new AI products, agents, models, and tools as they launch. Powered by AgentScreener Intelligence.",
  openGraph: {
    title: "AI Product Scanner — AgentScreener",
    description:
      "Real-time detection of new AI products, agents, models, and tools as they launch. Powered by AgentScreener Intelligence.",
    type: "website",
    siteName: "AgentScreener",
  },
  twitter: {
    card: "summary",
    title: "AI Product Scanner — AgentScreener",
    description:
      "Real-time detection of new AI products, agents, models, and tools as they launch.",
  },
};

import ScannerClient from "./ScannerClient";

export default function ScannerPage() {
  return <ScannerClient />;
}
