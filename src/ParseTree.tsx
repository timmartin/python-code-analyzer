import * as React from "react";
import createEngine, {
  DiagramModel,
  DefaultNodeModel,
  DefaultLinkModel,
} from "@projectstorm/react-diagrams";
import { CanvasWidget } from "@projectstorm/react-canvas-core";
import { ASTNodeFactory } from "./diagrams/ASTNodeFactory";
import ASTNodeModel from "./diagrams/ASTNodeModel";

interface ASTAssignment {
  _astname: "Assign";
  value: ASTNode;
  targets: ASTNode[];
}

interface ASTNumber {
  _astname: "Num";
}

interface ASTName {
  _astname: "Name";
}

type ASTNode = ASTAssignment | ASTNumber | ASTName;

interface ParseTreeProps {
  ast: ASTNode[];
}

const makeAssignmentNode = (ast: ASTAssignment) => {
  const links: DefaultLinkModel[] = [];

  const mainNode = new ASTNodeModel("Assign");
  mainNode.setPosition(100, 100);
  const valuePort = mainNode.addSubtreePort("Value");
  const targetPort = mainNode.addSubtreePort("Target");

  const valueNode = new ASTNodeModel(ast.value._astname);
  valueNode.setPosition(300, 100);
  links.push(valuePort.link<DefaultLinkModel>(valueNode.inPort));

  const targetNode = new ASTNodeModel(ast.targets[0]._astname);
  targetNode.setPosition(300, 200);

  links.push(targetPort.link<DefaultLinkModel>(targetNode.inPort));

  return [[mainNode, valueNode, targetNode], links];
}

const ParseTree = ({ ast }: ParseTreeProps) => {
  var engine = createEngine();
  engine.getNodeFactories().registerFactory(new ASTNodeFactory())
  var model = new DiagramModel();

  if (ast[0]._astname === "Assign") {
    const [nodes, links] = makeAssignmentNode(ast[0]);
    nodes.forEach((node) => model.addNode(node));
    links.forEach((link) => model.addLink(link));
  }

  engine.setModel(model);

  return (
    <div className="python-analyzer-view parse-tree">
      <CanvasWidget engine={engine} className="block-diagram-canvas" />
    </div>
  );
};

export default ParseTree;
