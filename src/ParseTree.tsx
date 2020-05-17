import * as React from "react";
import createEngine, {
  DiagramModel,
  DefaultNodeModel,
  DefaultLinkModel,
} from "@projectstorm/react-diagrams";
import { CanvasWidget } from "@projectstorm/react-canvas-core";

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

const makeAssignment = (ast: ASTAssignment) => {
  const links: DefaultLinkModel[] = [];

  const mainNode = new DefaultNodeModel("Assignment", "rgb(192,255,0)");
  mainNode.setPosition(100, 100);
  const valuePort = mainNode.addOutPort("Value");
  const targetPort = mainNode.addOutPort("Target");

  const valueNode = new DefaultNodeModel(ast.value._astname, "rgb(192,255,0)");
  valueNode.setPosition(300, 100);
  const valueInPort = valueNode.addInPort("In");
  links.push(valuePort.link<DefaultLinkModel>(valueInPort));

  const targetNode = new DefaultNodeModel(ast.targets[0]._astname, "rgb(192,255,0)");
  targetNode.setPosition(300, 200);
  const targetInPort = targetNode.addInPort("in");
  links.push(targetPort.link<DefaultLinkModel>(targetInPort));

  return [[mainNode, valueNode, targetNode], links];
}

const ParseTree = ({ ast }: ParseTreeProps) => {
  var engine = createEngine();
  var model = new DiagramModel();

  if (ast[0]._astname === "Assign") {
    const [nodes, links] = makeAssignment(ast[0]);
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
