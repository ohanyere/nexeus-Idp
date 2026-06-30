import type { StatusTone } from "@/lib/mock-data";

export type TopologyNodeKind =
 | "service"
 | "database"
 | "cache"
 | "queue"
 | "storage"
 | "external-api"
 | "platform-service";

export type TopologyEnvironment = "dev" | "stage" | "prod" | "shared";

export type TopologyHealth = "healthy" | "warning" | "failed" | "unknown";

export type TopologyEdgeKind = "api" | "database" | "queue" | "cache" | "storage";

export type ServiceTopologyNode = {
 id: string;
 name: string;
 kind: TopologyNodeKind;
 health: TopologyHealth;
 owner: string;
 environment: TopologyEnvironment;
 language?: string;
 runtime?: string;
 description?: string;
 connectedServices: string[];
 position: {
  x: number;
  y: number;
 };
};

export type ServiceTopologyEdge = {
 id: string;
 source: string;
 target: string;
 kind: TopologyEdgeKind;
 label: string;
 direction: "depends-on" | "consumed-by";
};

export type ServiceTopology = {
 serviceId: string;
 serviceName: string;
 owner: string;
 language: string;
 runtime: string;
 environments: TopologyEnvironment[];
 nodes: ServiceTopologyNode[];
 edges: ServiceTopologyEdge[];
};

export function topologyTone(health: TopologyHealth): StatusTone {
 if (health === "healthy") {
  return "success";
 }

 if (health === "warning") {
  return "warning";
 }

 if (health === "failed") {
  return "danger";
 }

 return "neutral";
}
