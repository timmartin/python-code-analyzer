import { PortWidget } from "@projectstorm/react-diagrams";
import { DiagramEngine } from "@projectstorm/react-diagrams-core";
import * as React from "react";

import ObjectTreeNodeModel from "./ObjectTreeNodeModel";

interface Props {
  node: ObjectTreeNodeModel;
  engine: DiagramEngine;
}

const ObjectTreeNodeWidget: React.FC<Props> = ({ node, engine }: Props) => (
  <div className="object-tree-node">
    <PortWidget className="input-port" port={node.inPort} engine={engine} />
    <div className="node-label">{node.name}</div>
  </div>
);

export default ObjectTreeNodeWidget;
