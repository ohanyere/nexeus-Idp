import { TopologyGraph } from "@/components/topology/TopologyGraph";
import { getTopologyByServiceId } from "@/components/topology/mockTopology";
import type { Service } from "@/lib/mock-data";

type ServiceTopologyGraphProps = {
 service: Service;
};

export function ServiceTopologyGraph({ service }: ServiceTopologyGraphProps) {
 return <TopologyGraph topology={getTopologyByServiceId(service.id)} />;
}
