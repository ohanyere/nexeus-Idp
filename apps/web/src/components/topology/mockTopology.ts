import type { ServiceTopology, TopologyEdgeKind, TopologyHealth, TopologyNodeKind } from "@/components/topology/types";

const nodeMeta: Record<TopologyNodeKind, { owner: string; health: TopologyHealth; environment: "dev" | "stage" | "prod" | "shared" }> = {
 service: { owner: "Payments Team", health: "healthy", environment: "prod" },
 database: { owner: "Platform Team", health: "healthy", environment: "prod" },
 cache: { owner: "Platform Team", health: "warning", environment: "stage" },
 queue: { owner: "Platform Team", health: "healthy", environment: "prod" },
 storage: { owner: "Platform Team", health: "healthy", environment: "prod" },
 "external-api": { owner: "External Vendor", health: "unknown", environment: "shared" },
 "platform-service": { owner: "Platform Team", health: "healthy", environment: "shared" }
};

const edgeLabels: Record<TopologyEdgeKind, string> = {
 api: "API Call",
 database: "Database Connection",
 queue: "Message Queue",
 cache: "Cache",
 storage: "Storage"
};

function resourceNode(
 id: string,
 name: string,
 kind: TopologyNodeKind,
 x: number,
 y: number,
 connectedServices: string[],
 description?: string
) {
 const meta = nodeMeta[kind];

 return {
  id,
  name,
  kind,
  health: meta.health,
  owner: meta.owner,
  environment: meta.environment,
  runtime: kind === "database" ? "PostgreSQL" : kind === "cache" ? "Redis" : kind === "queue" ? "Kafka" : kind === "storage" ? "S3" : "HTTP",
  description,
  connectedServices,
  position: { x, y }
 };
}

function edge(source: string, target: string, kind: TopologyEdgeKind, direction: "depends-on" | "consumed-by" = "depends-on") {
 return {
  id: `${source}-${target}-${kind}`,
  source,
  target,
  kind,
  label: edgeLabels[kind],
  direction
 };
}

export const serviceTopologies: ServiceTopology[] = [
 {
  serviceId: "payments-api",
  serviceName: "Payments API",
  owner: "Payments Team",
  language: "Go",
  runtime: "Kubernetes",
  environments: ["dev", "stage", "prod"],
  nodes: [
   { id: "payments-api", name: "Payments API", kind: "service", health: "healthy", owner: "Payments Team", language: "Go", runtime: "Kubernetes", environment: "prod", connectedServices: ["checkout-service", "orders-worker"], position: { x: 360, y: 210 } },
   resourceNode("payments-postgres", "payments-postgres", "database", 80, 70, ["payments-api", "checkout-service"], "Primary ledger and payment method store."),
   resourceNode("payments-redis", "payments-redis", "cache", 80, 330, ["payments-api"], "Authorization and idempotency cache."),
   resourceNode("payments-events", "payments-events", "queue", 650, 80, ["payments-api", "orders-worker"], "Payment authorization and capture events."),
   resourceNode("stripe-api", "Stripe API", "external-api", 670, 330, ["payments-api"], "External payment provider API."),
   resourceNode("secrets-broker", "Secrets Broker", "platform-service", 360, 20, ["payments-api", "checkout-service", "catalog-api"], "Platform secret distribution service.")
  ],
  edges: [
   edge("payments-api", "payments-postgres", "database"),
   edge("payments-api", "payments-redis", "cache"),
   edge("payments-api", "payments-events", "queue"),
   edge("payments-api", "stripe-api", "api"),
   edge("payments-api", "secrets-broker", "api")
  ]
 },
 {
  serviceId: "checkout-service",
  serviceName: "Checkout Service",
  owner: "Commerce",
  language: "Node.js",
  runtime: "Kubernetes",
  environments: ["dev", "stage", "prod"],
  nodes: [
   { id: "checkout-service", name: "Checkout Service", kind: "service", health: "warning", owner: "Commerce", language: "Node.js", runtime: "Kubernetes", environment: "prod", connectedServices: ["payments-api", "catalog-api", "orders-worker"], position: { x: 360, y: 210 } },
   resourceNode("checkout-postgres", "checkout-postgres", "database", 80, 80, ["checkout-service"], "Checkout session state."),
   resourceNode("checkout-redis", "checkout-redis", "cache", 80, 330, ["checkout-service"], "Cart and session cache."),
   resourceNode("payments-api", "Payments API", "service", 670, 90, ["checkout-service"], "Payment authorization dependency."),
   resourceNode("catalog-api", "Catalog API", "service", 670, 330, ["checkout-service"], "Product and price lookup."),
   resourceNode("checkout-events", "checkout-events", "queue", 360, 440, ["checkout-service", "orders-worker"], "Order placement event stream.")
  ],
  edges: [
   edge("checkout-service", "checkout-postgres", "database"),
   edge("checkout-service", "checkout-redis", "cache"),
   edge("checkout-service", "payments-api", "api"),
   edge("checkout-service", "catalog-api", "api"),
   edge("checkout-service", "checkout-events", "queue")
  ]
 },
 {
  serviceId: "catalog-api",
  serviceName: "Catalog API",
  owner: "Commerce",
  language: "Python",
  runtime: "Kubernetes",
  environments: ["dev", "stage", "prod"],
  nodes: [
   { id: "catalog-api", name: "Catalog API", kind: "service", health: "warning", owner: "Commerce", language: "Python", runtime: "Kubernetes", environment: "stage", connectedServices: ["checkout-service", "idp-portal"], position: { x: 360, y: 210 } },
   resourceNode("catalog-postgres", "catalog-postgres", "database", 90, 90, ["catalog-api"], "Product catalog store."),
   resourceNode("catalog-cache", "catalog-cache", "cache", 90, 330, ["catalog-api", "checkout-service"], "Search result and product cache."),
   resourceNode("s3-product-assets", "s3-product-assets", "storage", 650, 95, ["catalog-api"], "Product images and documents."),
   resourceNode("search-api", "Search API", "external-api", 660, 330, ["catalog-api"], "Managed search provider.")
  ],
  edges: [
   edge("catalog-api", "catalog-postgres", "database"),
   edge("catalog-api", "catalog-cache", "cache"),
   edge("catalog-api", "s3-product-assets", "storage"),
   edge("catalog-api", "search-api", "api")
  ]
 },
 {
  serviceId: "orders-worker",
  serviceName: "Orders Worker",
  owner: "Commerce",
  language: "Go",
  runtime: "Kubernetes",
  environments: ["stage", "prod"],
  nodes: [
   { id: "orders-worker", name: "Orders Worker", kind: "service", health: "failed", owner: "Commerce", language: "Go", runtime: "Kubernetes", environment: "stage", connectedServices: ["checkout-service", "payments-api"], position: { x: 360, y: 210 } },
   resourceNode("orders-postgres", "orders-postgres", "database", 80, 95, ["orders-worker"], "Order fulfillment records."),
   resourceNode("sqs-order-events", "sqs-order-events", "queue", 80, 330, ["orders-worker"], "Fulfillment queue."),
   resourceNode("payments-api", "Payments API", "service", 670, 95, ["orders-worker"], "Payment status updates."),
   resourceNode("shipping-api", "Shipping API", "external-api", 670, 330, ["orders-worker"], "External shipping provider.")
  ],
  edges: [
   edge("orders-worker", "orders-postgres", "database"),
   edge("orders-worker", "sqs-order-events", "queue"),
   edge("orders-worker", "payments-api", "api"),
   edge("orders-worker", "shipping-api", "api")
  ]
 },
 {
  serviceId: "idp-portal",
  serviceName: "IDP Portal",
  owner: "Developer Experience",
  language: "TypeScript",
  runtime: "Next.js",
  environments: ["dev", "stage"],
  nodes: [
   { id: "idp-portal", name: "IDP Portal", kind: "service", health: "healthy", owner: "Developer Experience", language: "TypeScript", runtime: "Next.js", environment: "dev", connectedServices: ["catalog-api"], position: { x: 360, y: 210 } },
   resourceNode("platform-catalog", "Platform Catalog", "platform-service", 90, 95, ["idp-portal"], "Catalog metadata API."),
   resourceNode("github-api", "GitHub API", "external-api", 90, 330, ["idp-portal"], "Repository, PR, and workflow provider."),
   resourceNode("scorecard-worker", "Scorecard Worker", "platform-service", 670, 95, ["idp-portal"], "Governance scoring worker."),
   resourceNode("audit-log", "Audit Log", "storage", 670, 330, ["idp-portal"], "Release and platform audit trail.")
  ],
  edges: [
   edge("idp-portal", "platform-catalog", "api"),
   edge("idp-portal", "github-api", "api"),
   edge("idp-portal", "scorecard-worker", "api"),
   edge("idp-portal", "audit-log", "storage")
  ]
 }
];

export function getTopologyByServiceId(serviceId: string) {
 return serviceTopologies.find((topology) => topology.serviceId === serviceId);
}
