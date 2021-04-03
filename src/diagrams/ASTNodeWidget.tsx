import * as React from "react";
import ASTNodeModel from "./ASTNodeModel";
import { PortWidget, DiagramEngine } from "@projectstorm/react-diagrams";

interface Props {
  node: ASTNodeModel;
  engine: DiagramEngine;
}

const ASTNodeWidget: React.FC<Props> = ({node, engine}: Props) => {
  return (
    <div className="ast-node">
      <PortWidget
        className="input-port"
        port={node.inPort}
        engine={engine}
      />
      <div className="node-label">{node.name}</div>
      {node.value && <div className="node-value">{node.value}</div>}
      {node.subtreePorts.map((port, idx) => (
        <div className="node-link" key={idx}>
          <div className="link-label">{port.getName()}</div>
          <PortWidget port={port} engine={engine} />
        </div>
      ))}
    </div>
  );
};

export default ASTNodeWidget;
