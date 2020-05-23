import * as React from "react";
import * as Sk from "skulpt";
import createEngine, {
  DiagramModel,
  DefaultLinkModel,
} from "@projectstorm/react-diagrams";
import { CanvasWidget } from "@projectstorm/react-canvas-core";

import { assertNever } from "./utils";
import { ASTNodeFactory } from "./diagrams/ASTNodeFactory";
import ASTNodeModel from "./diagrams/ASTNodeModel";

interface ASTAssignment {
  _astname: "Assign";
  value: ASTNode;
  targets: ASTNode[];
}

interface ASTNumber {
  _astname: "Num";
  n: object;
}

interface ASTName {
  _astname: "Name";
  id: object;
}

type ASTNode = ASTAssignment | ASTNumber | ASTName;

interface ParseTreeProps {
  ast: ASTNode[];
}

const makeNumberNode = (ast: ASTNumber) => {
  return new ASTNodeModel("Number", Sk.ffi.remapToJs(ast.n).toString());
};

const makeNameNode = (ast: ASTName) => {
  console.log(ast);
  return new ASTNodeModel("Name", Sk.ffi.remapToJs(ast.id));
}

const makeAssignmentNode = (ast: ASTAssignment) => {
  const links: DefaultLinkModel[] = [];

  const mainNode = new ASTNodeModel("Assign");
  mainNode.setPosition(100, 100);
  const valuePort = mainNode.addSubtreePort("Value");
  const targetPort = mainNode.addSubtreePort("Target");

  const valueNode = makeASTNode(ast.value);
  valueNode.setPosition(300, 100);
  links.push(valuePort.link<DefaultLinkModel>(valueNode.inPort));

  const targetNode = makeASTNode(ast.targets[0]);
  targetNode.setPosition(300, 200);

  links.push(targetPort.link<DefaultLinkModel>(targetNode.inPort));

  return [[mainNode, valueNode, targetNode], links];
};

const makeASTNode = (ast: ASTNode) => {
  if (ast._astname === "Assign") {
    return makeAssignmentNode(ast);
  } else if (ast._astname === "Num") {
    return makeNumberNode(ast);
  } else if (ast._astname === "Name") {
    return makeNameNode(ast);
  } else {
    assertNever(ast);
  }
};

const ParseTree = ({ ast }: ParseTreeProps) => {
  var engine = createEngine();
  engine.getNodeFactories().registerFactory(new ASTNodeFactory());
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
