import * as React from "react";
import ASTNodeModel from "./ASTNodeModel";
import { PortWidget, DiagramEngine } from "@projectstorm/react-diagrams";

interface Props {
  node: ASTNodeModel;
  engine: DiagramEngine;
}

const ASTNodeWidget: (props: Props) => React.ReactElement = (props: Props) => {
  return (
    <div className="ast-node">
      <PortWidget
        className="input-port"
        port={props.node.inPort}
        engine={props.engine}
      />
      <div className="node-label">{props.node.name}</div>
      {props.node.value && <div className="node-value">{props.node.value}</div>}
      {props.node.subtreePorts.map((port, idx) => (
        <div className="node-link" key={idx}>
          <div className="link-label">{port.getName()}</div>
          <PortWidget port={port} engine={props.engine} />
        </div>
      ))}
    </div>
  );
};

export default ASTNodeWidget;
