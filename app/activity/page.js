export const metadata = {
  title: "Activity — AgentScreener",
  description: "Real-time commit activity heatmaps across the AI product ecosystem. Track development momentum for 130+ AI products.",
  openGraph: {
    title: "Activity — AgentScreener",
    description: "Real-time commit activity heatmaps across the AI product ecosystem.",
  },
};

import ActivityClient from "./ActivityClient";

export default function ActivityPage() {
  return <ActivityClient />;
}
