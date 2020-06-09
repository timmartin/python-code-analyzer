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

// Function type for turning an AST node into entries on the diagram
//
// The function returns a tuple of:
// - The diagram node that directly corresponds to the AST node
// - An array of sub-nodes in the child tree
// - An array of links in the child tree
type NodeRenderer<T extends ASTNode> = (ast: T) => [ASTNodeModel, ASTNodeModel[], DefaultLinkModel[]];

interface ParseTreeProps {
  code: string;
}

const makeNumberNode: NodeRenderer<ASTNumber> = (ast) => {
  return [new ASTNodeModel("Number", Sk.ffi.remapToJs(ast.n).toString()), [], []];
};

const makeNameNode: NodeRenderer<ASTName> = (ast) => {
  return [new ASTNodeModel("Name", Sk.ffi.remapToJs(ast.id)), [], []];
};

const makeBinOpNode: NodeRenderer<ASTBinOp> = (ast) => {
  let links: DefaultLinkModel[] = [];
  let childNodes: ASTNodeModel[] = [];

  const mainNode = new ASTNodeModel("Binary op");
  const leftPort = mainNode.addSubtreePort("Left");
  const rightPort = mainNode.addSubtreePort("Right");

  const [leftNode, leftChildNodes, leftChildLinks] = makeASTNode(ast.left);
  childNodes.push(leftNode);
  childNodes = childNodes.concat(leftChildNodes);
  links = links.concat(leftChildLinks);

  links.push(leftPort.link<DefaultLinkModel>(leftNode.inPort));

  const [rightNode, rightChildNodes, rightChildLinks] = makeASTNode(ast.right);
  childNodes.push(rightNode);
  childNodes = childNodes.concat(rightChildNodes);
  links = links.concat(rightChildLinks);

  links.push(rightPort.link<DefaultLinkModel>(rightNode.inPort));

  return [mainNode, childNodes, links];
}

const makeAssignmentNode: NodeRenderer<ASTAssignment> = (ast) => {
  let links: DefaultLinkModel[] = [];
  let additionalNodes: ASTNodeModel[] = [];

  const mainNode = new ASTNodeModel("Assign");
  const valuePort = mainNode.addSubtreePort("Value");
  const targetPort = mainNode.addSubtreePort("Target");

  const [valueNode, valueChildNodes, valueChildLinks] = makeASTNode(ast.value);
  additionalNodes = additionalNodes.concat(valueChildNodes);
  links = links.concat(valueChildLinks);
  links.push(valuePort.link<DefaultLinkModel>(valueNode.inPort));

  const [targetNode, targetChildNodes, targetChildLinks] = makeASTNode(ast.targets[0]);
  additionalNodes = additionalNodes.concat(targetChildNodes);
  links = links.concat(targetChildLinks);

  links.push(targetPort.link<DefaultLinkModel>(targetNode.inPort));

  return [mainNode, [valueNode, targetNode, ...additionalNodes], links];
};

const makeASTNode: NodeRenderer<ASTNode> = (ast) => {
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

const ParseTree = ({code}: ParseTreeProps) => {
  const parse = Sk.parse("<str>", code);
  const ast = Sk.astFromParse(parse.cst, "<str>").body;

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

  const [node, childNodes, childLinks] = makeASTNode(ast[0]);
  model.addNode(node);
  childNodes.forEach((node) => model.addNode(node));
  childLinks.forEach((link) => model.addLink(link));

  routingEngine.redistribute(model);

  engine.setModel(model);

  return (
    <div className="python-analyzer-view parse-tree">
      <CanvasWidget engine={engine} className="block-diagram-canvas" />
    </div>
  );
};

export default ParseTree;
