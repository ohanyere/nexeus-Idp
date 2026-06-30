import { TopologyGraph } from "@/components/topology/TopologyGraph";
import { getTopologyByServiceId } from "@/components/topology/mockTopology";
import type { ServiceTopology, TopologyEdgeKind, TopologyNodeKind } from "@/components/topology/types";
import { getProvisionedResourcesForService } from "@/lib/infrastructure";
import type { Service } from "@/lib/mock-data";

type ServiceTopologyGraphProps = {
 service: Service;
};

export function ServiceTopologyGraph({ service }: ServiceTopologyGraphProps) {
 return <TopologyGraph topology={withProvisionedResources(getTopologyByServiceId(service.id), service.id)} />;
}

function withProvisionedResources(topology: ServiceTopology | undefined, serviceId: string) {
 if (!topology) {
 return topology;
 }

 const linkedResources = getProvisionedResourcesForService(serviceId);

 if (!linkedResources.length) {
 return topology;
 }

 const nodes = linkedResources.map((resource, index) => ({
 id: `infra-${resource.id}`,
 name: resource.name,
 kind: topologyKind(resource.type),
 health: resource.status === "Failed" ? "failed" as const : resource.status === "Provisioning" || resource.status === "Pending" ? "warning" as const : "healthy" as const,
 owner: resource.owner,
 environment: resource.environment,
 runtime: resource.provider,
 description: `${resource.type} provisioned through Self-Service Infrastructure.`,
 connectedServices: [serviceId],
 position: {
 x: 150 + index * 230,
 y: 560
 }
 }));
 const edges = linkedResources.map((resource) => {
 const kind = edgeKind(resource.type);
 return {
 id: `${serviceId}-infra-${resource.id}`,
 source: serviceId,
 target: `infra-${resource.id}`,
 kind,
 label: resource.type,
 direction: "depends-on" as const
 };
 });

 return {
 ...topology,
 nodes: [...topology.nodes, ...nodes],
 edges: [...topology.edges, ...edges]
 };
}

function topologyKind(type: string): TopologyNodeKind {
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
