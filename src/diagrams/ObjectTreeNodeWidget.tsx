import { DefaultPortModel, PortWidget } from "@projectstorm/react-diagrams";
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
    {node.properties.map(({ name, value }, idx) => (
      <div className="node-link" key={idx}>
        <div className="link-label">
          {name}
          {!(value instanceof DefaultPortModel) && value}
        </div>
        {value instanceof DefaultPortModel && (
          <PortWidget port={value} engine={engine} />
        )}
      </div>
    ))}
  </div>
);

export default ObjectTreeNodeWidget;
