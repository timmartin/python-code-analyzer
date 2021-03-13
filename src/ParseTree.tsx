import * as React from "react";
import { useMemo } from "react";
import Sk from "@timmartin2/skulpt";

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
  op: ASTNode;
  right: ASTNode;
}

interface ASTModule {
  _astname: "Module";
  body: ASTNode[];
  docstring: string;
}

// This combines together several different node types that are different
// nodes in the AST, but are all rendered the same with a different name.
interface ASTOperator {
  _astname:
    | "Add"
    | "Sub"
    | "Mult"
    | "MatMult"
    | "Div"
    | "Mod"
    | "Pow"
    | "LShift"
    | "RShift"
    | "BitOr"
    | "BitXor"
    | "BitAnd"
    | "FloorDiv";
}

type ASTNode =
  | ASTAssignment
  | ASTBinOp
  | ASTName
  | ASTNumber
  | ASTModule
  | ASTOperator;

function isASTOperator(node: ASTNode): node is ASTOperator {
  return (
    node._astname === "Add" ||
    node._astname === "Sub" ||
    node._astname === "Mult" ||
    node._astname === "MatMult" ||
    node._astname === "Div" ||
    node._astname === "Mod" ||
    node._astname === "Pow" ||
    node._astname === "LShift" ||
    node._astname === "RShift" ||
    node._astname === "BitOr" ||
    node._astname === "BitXor" ||
    node._astname === "BitAnd" ||
    node._astname === "FloorDiv"
  );
}

// Function type for turning an AST node into entries on the diagram
//
// The function returns a tuple of:
// - The diagram node that directly corresponds to the AST node
// - An array of sub-nodes in the child tree
// - An array of links in the child tree
type NodeRenderer<T extends ASTNode> = (
  ast: T
) => [ASTNodeModel, ASTNodeModel[], DefaultLinkModel[]];

interface ParseTreeProps {
  code: string;
  mode?: "module" | "statement";
}

const makeNumberNode: NodeRenderer<ASTNumber> = (ast) => {
  return [
    new ASTNodeModel("Number", Sk.ffi.remapToJs(ast.n).toString()),
    [],
    [],
  ];
};

const makeNameNode: NodeRenderer<ASTName> = (ast) => {
  return [new ASTNodeModel("Name", Sk.ffi.remapToJs(ast.id)), [], []];
};

const makeBinOpNode: NodeRenderer<ASTBinOp> = (ast) => {
  let links: DefaultLinkModel[] = [];
  let childNodes: ASTNodeModel[] = [];

  const mainNode = new ASTNodeModel("Binary op");
  const operatorPort = mainNode.addSubtreePort("Operator");
  const leftPort = mainNode.addSubtreePort("Left");
  const rightPort = mainNode.addSubtreePort("Right");

  // We have to call the constructor on the operator object, because the
  // Skulpt parser doesn't do this, the node in the AST is the class and
  // not a constructed instance. Calling the constructor means we can
  // handle this more consistently in the recursive call.
  const [operatorNode, operatorChildNodes, operatorChildLinks] = makeASTNode(new ast.op());

  childNodes.push(operatorNode);
  childNodes = childNodes.concat(operatorChildNodes);
  links = links.concat(operatorChildLinks);

  links.push(operatorPort.link<DefaultLinkModel>(operatorNode.inPort));

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
};

const makeModuleNode: NodeRenderer<ASTModule> = (ast) => {
  let links: DefaultLinkModel[] = [];
  let childNodes: ASTNodeModel[] = [];

  const mainNode = new ASTNodeModel("Module");
  const bodyPort = mainNode.addSubtreePort("Body");

  for (const entry of ast.body) {
    const [entryNode, entryChildNodes, childLinks] = makeASTNode(entry);

    links = links.concat(childLinks);
    links.push(bodyPort.link<DefaultLinkModel>(entryNode.inPort));

    childNodes.push(entryNode);
    childNodes = childNodes.concat(entryChildNodes);
  }

  return [mainNode, childNodes, links];
};

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

  const [targetNode, targetChildNodes, targetChildLinks] = makeASTNode(
    ast.targets[0]
  );
  additionalNodes = additionalNodes.concat(targetChildNodes);
  links = links.concat(targetChildLinks);

  links.push(targetPort.link<DefaultLinkModel>(targetNode.inPort));

  return [mainNode, [valueNode, targetNode, ...additionalNodes], links];
};

const makeOperatorNode: NodeRenderer<ASTOperator> = (ast) => {
  const node = new ASTNodeModel(ast._astname);

  return [node, [], []];
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
  } else if (ast._astname === "Module") {
    return makeModuleNode(ast);
  } else if (isASTOperator(ast)) {
    return makeOperatorNode(ast);
  } else {
    assertNever(ast);
  }
};

const ParseTree = ({ code, mode = "statement" }: ParseTreeProps) => {
  const engine = useMemo(() => {
    const engine = createEngine();
    engine.getNodeFactories().registerFactory(new ASTNodeFactory());
    return engine;
  }, []);

  const routingEngine = useMemo(
    () =>
      new DagreEngine({
        graph: {
          rankDir: "LR",
          marginx: 25,
          marginy: 25,
        },
        includeLinks: true,
      }),
    []
  );

  const parse = Sk.parse("<str>", code);
  var ast = Sk.astFromParse(parse.cst, "<str>");
  if (mode === "statement") {
    ast = ast.body[0];
  }

  const model = new DiagramModel();

  const [node, childNodes, childLinks] = makeASTNode(ast);
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
