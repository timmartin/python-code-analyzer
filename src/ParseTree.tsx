import * as React from "react";
import * as Sk from "skulpt";
import createEngine, {
  DagreEngine,
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

interface ASTBinOp {
  _astname: "BinOp";
  left: ASTNode;
  op: object;
  right: ASTNode;
}

type ASTNode = ASTAssignment | ASTBinOp | ASTName | ASTNumber;

interface ParseTreeProps {
  ast: ASTNode[];
}

const makeNumberNode = (ast: ASTNumber) => {
  return new ASTNodeModel("Number", Sk.ffi.remapToJs(ast.n).toString());
};

const makeNameNode = (ast: ASTName) => {
  return new ASTNodeModel("Name", Sk.ffi.remapToJs(ast.id));
};

const makeBinOpNode = (ast: ASTBinOp) => {
  const links: DefaultLinkModel[] = [];

  const mainNode = new ASTNodeModel("Binary op");
  const leftPort = mainNode.addSubtreePort("Left");
  const rightPort = mainNode.addSubtreePort("Right");

  const leftNode = makeASTNode(ast.left);
  links.push(leftPort.link<DefaultLinkModel>(leftNode.inPort));

  const rightNode = makeASTNode(ast.right);
  links.push(rightPort.link<DefaultLinkModel>(rightNode.inPort));

  return [mainNode, [leftNode, rightNode], links];
}

const makeAssignmentNode = (ast: ASTAssignment) => {
  let links: DefaultLinkModel[] = [];

  const mainNode = new ASTNodeModel("Assign");
  const valuePort = mainNode.addSubtreePort("Value");
  const targetPort = mainNode.addSubtreePort("Target");

  const [valueNode, additionalNodes, additionalLinks] = makeASTNode(ast.value);
  links = links.concat(additionalLinks);
  links.push(valuePort.link<DefaultLinkModel>(valueNode.inPort));

  const targetNode = makeASTNode(ast.targets[0]);

  links.push(targetPort.link<DefaultLinkModel>(targetNode.inPort));

  return [[mainNode, valueNode, targetNode, ...additionalNodes], links];
};

const makeASTNode = (ast: ASTNode) => {
  if (ast._astname === "Assign") {
    return makeAssignmentNode(ast);
  } else if (ast._astname === "BinOp") {
    return makeBinOpNode(ast);
  } else if (ast._astname === "Num") {
    return makeNumberNode(ast);
  } else if (ast._astname === "Name") {
    return makeNameNode(ast);
  } else {
    assertNever(ast);
  }
};

const ParseTree = ({ ast }: ParseTreeProps) => {
  const engine = createEngine();
  engine.getNodeFactories().registerFactory(new ASTNodeFactory());

  const routingEngine = new DagreEngine({
    graph: {
      rankDir: "LR",
      marginx: 25,
      marginy: 25,
    },
    includeLinks: true,
  });

  const model = new DiagramModel();

  if (ast[0]._astname === "Assign") {
    const [nodes, links] = makeAssignmentNode(ast[0]);
    nodes.forEach((node) => model.addNode(node));
    links.forEach((link) => model.addLink(link));
  }

  routingEngine.redistribute(model);

  engine.setModel(model);

  return (
    <div className="python-analyzer-view parse-tree">
      <CanvasWidget engine={engine} className="block-diagram-canvas" />
    </div>
  );
};

export default ParseTree;
