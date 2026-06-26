import { TopologyFlow } from "@/components/TopologyFlow";
import type { Service } from "@/lib/mock-data";

type ServiceTopologyGraphProps = {
 service: Service;
};

export function ServiceTopologyGraph({ service }: ServiceTopologyGraphProps) {
 return (
 <TopologyFlow
 services={[service]}
 title="Service topology"
 height="360px"
 />
 );
}
