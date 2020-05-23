import * as React from "react";
import ASTNodeModel from "./ASTNodeModel";
import { PortWidget, DiagramEngine } from "@projectstorm/react-diagrams";

interface Props {
  node: ASTNodeModel;
  engine: DiagramEngine;
}

const ASTNodeWidget = (props: Props) => {
  return (
    <div className="ast-node">
      <PortWidget port={props.node.inPort} engine={props.engine} />
      {props.node.name}
      {props.node.subtreePorts.map((port, idx) => (
        <PortWidget key={idx} port={port} engine={props.engine} />
      ))}
    </div>
  );
};

export default ASTNodeWidget;
