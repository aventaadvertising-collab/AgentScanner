import { getProducts, getProductById } from "@/lib/products";
import { notFound } from "next/navigation";
import ProductPageClient from "./ProductPageClient";

export function generateMetadata({ params }) {
  const product = getProductById(params.id);
  if (!product) return { title: "Not Found — AgentScreener" };

  const desc = `${product.name} — ${product.category}. ${product.description}. Track revenue, users, GitHub activity, and funding on AgentScreener.`;

  return {
    title: `${product.name} — AgentScreener`,
    description: desc,
    openGraph: {
      title: `${product.name} — AgentScreener`,
      description: desc,
      type: "website",
      siteName: "AgentScreener",
    },
    twitter: {
      card: "summary",
      title: `${product.name} — AgentScreener`,
      description: desc,
    },
  };
}

export function generateStaticParams() {
  return getProducts().map(p => ({ id: p.id }));
}

export default function ProductPage({ params }) {
  const product = getProductById(params.id);
  if (!product) notFound();

  return <ProductPageClient product={product} />;
}
