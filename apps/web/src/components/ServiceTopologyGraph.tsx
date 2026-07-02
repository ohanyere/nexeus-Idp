import { TopologyGraph } from "@/components/topology/TopologyGraph";
import type { ServiceTopology, TopologyEdgeKind, TopologyNodeKind } from "@/components/topology/types";
import type { Service } from "@/lib/mock-data";
import type { ServiceResourceInventory } from "@/lib/service-resources";

type ServiceTopologyGraphProps = {
 service: Service;
 inventory?: ServiceResourceInventory;
};

export function ServiceTopologyGraph({ service, inventory }: ServiceTopologyGraphProps) {
 return <TopologyGraph topology={liveTopology(service, inventory)} emptyMessage={inventory?.warning ?? "No runtime resources found."} />;
}

function liveTopology(service: Service, inventory?: ServiceResourceInventory): ServiceTopology | undefined {
 if (!inventory || inventory.source !== "Cluster" || inventory.resources.length === 0) {
 return undefined;
 }

 const nodes = inventory.resources.slice(0, 18).map((resource, index) => ({
 id: `live-${resource.id}`,
 name: resource.name,
 kind: topologyKind(resource.kind),
 health: resource.status === "Failed" ? "failed" as const : resource.status === "Pending" || resource.status === "Progressing" ? "warning" as const : resource.status === "Unknown" ? "unknown" as const : "healthy" as const,
 owner: service.team,
 environment: resource.environment,
 runtime: resource.kind,
 description: `${resource.kind} discovered from Kubernetes namespace ${resource.namespace}.`,
 connectedServices: [service.id],
 position: {
 x: 90 + (index % 6) * 220,
 y: 120 + Math.floor(index / 6) * 170
 }
 }));
 const serviceNode = {
 id: service.id,
 name: service.name,
 kind: "service" as const,
 health: service.healthTone === "danger" ? "failed" as const : service.healthTone === "warning" ? "warning" as const : "healthy" as const,
 owner: service.team,
 language: service.template,
 runtime: "Kubernetes",
 environment: service.environment,
 connectedServices: inventory.resources.map((resource) => `live-${resource.id}`),
 position: { x: 540, y: 20 }
 };
 const edges = inventory.resources.slice(0, 18).map((resource) => ({
 id: `${service.id}-live-${resource.id}`,
 source: service.id,
 target: `live-${resource.id}`,
 kind: edgeKind(resource.kind),
 label: resource.kind,
 direction: "depends-on" as const
 }));

 return {
 serviceId: service.id,
 serviceName: service.name,
 owner: service.team,
 language: service.template,
 runtime: "Kubernetes",
 environments: service.environments,
 nodes: [serviceNode, ...nodes],
 edges
 };
}

function topologyKind(type: string): TopologyNodeKind {
 if (["PostgreSQL", "MySQL", "MongoDB", "RDS Instance"].includes(type)) {
 return "database";
 }
 if (type === "Redis" || type === "HPA") {
 return "cache";
 }
 if (["Kafka", "RabbitMQ", "SQS Queue", "SNS Topic", "Pod", "Rollout", "Event"].includes(type)) {
 return "queue";
 }
 if (["S3 Bucket", "Object Storage", "Persistent Volume", "Service"].includes(type)) {
 return "storage";
 }
 return "platform-service";
}

function edgeKind(type: string): TopologyEdgeKind {
 if (["PostgreSQL", "MySQL", "MongoDB", "RDS Instance"].includes(type)) {
 return "database";
 }
 if (type === "Redis") {
 return "cache";
 }
 if (["Kafka", "RabbitMQ", "SQS Queue", "SNS Topic"].includes(type)) {
 return "queue";
 }
 if (["S3 Bucket", "Object Storage", "Persistent Volume"].includes(type)) {
 return "storage";
 }
 return "api";
}
