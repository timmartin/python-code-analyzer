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
  op: typeof OperatorClass;
  right: ASTNode;
}

interface ASTModule {
  _astname: "Module";
  body: ASTNode[];
  docstring: string;
}

type OperatorASTName =
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

// This combines together several different node types that are different
// nodes in the AST, but are all rendered the same with a different name.
interface ASTOperator {
  _astname: OperatorASTName;
}

// This is a bit of a hack. The AST produced by Skulpt contains either objects
// or classes, depending on the node type; in the case of simple nodes with no
// members, the class is inserted into the AST. In order to represent the type
// of this, we declare our own class and pretend that we have one of those.
class OperatorClass implements ASTOperator {
  _astname: OperatorASTName;
}

interface ASTBooleanOperator {
  _astname: "And" | "Or";
}

class BooleanOperatorClass implements ASTBooleanOperator {
  _astname: "And" | "Or";
}

interface ASTBoolOp {
  _astname: "BoolOp";
  op: typeof BooleanOperatorClass;
  values: ASTNode[];
}

type CompareASTName =
  | "Eq"
  | "NotEq"
  | "Lt"
  | "LtE"
  | "Gt"
  | "GtE"
  | "Is"
  | "IsNot"
  | "In"
  | "NotIn";

interface ASTCompareOp {
  _astname: CompareASTName;
}

class CompareOperatorClass implements ASTCompareOp {
  _astname: CompareASTName;
}

interface ASTCompare {
  _astname: "Compare";
  left: ASTNode;
  ops: (typeof CompareOperatorClass)[];
  comparators: ASTNode[];
}

interface ASTIf {
  _astname: "If";
  test: ASTNode;
  body: ASTNode[];
  orelse: ASTNode[];
}

type ASTNode =
  | ASTAssignment
  | ASTBinOp
  | ASTName
  | ASTNumber
  | ASTModule
  | ASTOperator
  | ASTBoolOp
  | ASTBooleanOperator
  | ASTCompare
  | ASTCompareOp
  | ASTIf;

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

function isBooleanOperator(node: ASTNode): node is ASTBooleanOperator {
  return node._astname === "And" || node._astname === "Or";
}

function isCompareOperator(node: ASTNode): node is ASTCompareOp {
  return (
    node._astname === "Eq" ||
    node._astname === "NotEq" ||
    node._astname === "Lt" ||
    node._astname === "LtE" ||
    node._astname === "Gt" ||
    node._astname === "GtE" ||
    node._astname === "Is" ||
    node._astname === "IsNot" ||
    node._astname === "In" ||
    node._astname === "NotIn"
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
  const [operatorNode, operatorChildNodes, operatorChildLinks] = makeASTNode(
    new ast.op()
  );

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

const makeOperatorNode: NodeRenderer<
  ASTOperator | ASTBooleanOperator | ASTCompareOp
> = (ast) => {
  const node = new ASTNodeModel(ast._astname);

  return [node, [], []];
};

const makeBoolOpNode: NodeRenderer<ASTBoolOp> = (ast) => {
  const node = new ASTNodeModel("Boolean Op");

  let links: DefaultLinkModel[] = [];
  let nodes: ASTNodeModel[] = [];

  const [opNode, opChildNodes, opChildLinks] = makeASTNode(new ast.op());

  nodes.push(opNode);
  nodes = nodes.concat(opChildNodes);
  links = links.concat(opChildLinks);

  const operatorPort = node.addSubtreePort("Operator");
  links.push(operatorPort.link(opNode.inPort));

  ast.values.forEach((value, index) => {
    const [valueNode, childNodes, childLinks] = makeASTNode(value);
    nodes.push(valueNode);
    const port = node.addSubtreePort(`value ${index}`);
    links.push(port.link<DefaultLinkModel>(valueNode.inPort));

    nodes = nodes.concat(childNodes);
    links = links.concat(childLinks);
  });

  return [node, nodes, links];
};

const makeCompareNode: NodeRenderer<ASTCompare> = (ast) => {
  const node = new ASTNodeModel("Comparison");

  let links: DefaultLinkModel[] = [];
  let nodes: ASTNodeModel[] = [];

  const [leftNode, leftChildNodes, leftChildLinks] = makeASTNode(ast.left);

  nodes.push(leftNode);
  nodes = nodes.concat(leftChildNodes);
  links = links.concat(leftChildLinks);

  const leftPort = node.addSubtreePort("Left");
  links.push(leftPort.link(leftNode.inPort));

  ast.comparators.forEach((comparator, index) => {
    const port = node.addSubtreePort(`Comparator ${index}`);

    const [
      comparatorNode,
      comparatorChildNodes,
      comparatorChildLinks,
    ] = makeASTNode(comparator);
    nodes.push(comparatorNode);
    nodes = nodes.concat(comparatorChildNodes);
    links = links.concat(comparatorChildLinks);

    links.push(port.link(comparatorNode.inPort));
  });

  ast.ops.forEach((operator, index) => {
    const port = node.addSubtreePort(`Operator ${index}`);

    const [operatorNode, operatorChildNodes, operatorChildLinks] = makeASTNode(
      new operator()
    );

    nodes.push(operatorNode);
    nodes = nodes.concat(operatorChildNodes);
    links = links.concat(operatorChildLinks);

    links.push(port.link(operatorNode.inPort));
  });

  return [node, nodes, links];
};

const makeIfNode: NodeRenderer<ASTIf> = (ast) => {
  const node = new ASTNodeModel("If");

  let links: DefaultLinkModel[] = [];
  let nodes: ASTNodeModel[] = [];

  const [testNode, testChildNodes, testChildLinks] = makeASTNode(ast.test);

  nodes.push(testNode);
  nodes = nodes.concat(testChildNodes);
  links = links.concat(testChildLinks);

  const testPort = node.addSubtreePort("Test");
  links.push(testPort.link(testNode.inPort));

  const bodyPort = node.addSubtreePort("Body");
  ast.body.forEach((statement) => {
    const [
      statementNode,
      statementChildNodes,
      statementChildLinks,
    ] = makeASTNode(statement);

    nodes.push(statementNode);
    nodes = nodes.concat(statementChildNodes);
    links = links.concat(statementChildLinks);

    links.push(bodyPort.link(statementNode.inPort));
  });

  if (ast.orelse.length > 0) {
    const elsePort = node.addSubtreePort("OrElse");

    ast.orelse.forEach((statement) => {
      const [
        statementNode,
        statementChildNodes,
        statementChildLinks,
      ] = makeASTNode(statement);

      nodes.push(statementNode);
      nodes = nodes.concat(statementChildNodes);
      links = links.concat(statementChildLinks);

      links.push(elsePort.link(statementNode.inPort));
    });
  }

  return [node, nodes, links];
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
  } else if (
    isASTOperator(ast) ||
    isBooleanOperator(ast) ||
    isCompareOperator(ast)
  ) {
    return makeOperatorNode(ast);
  } else if (ast._astname === "BoolOp") {
    return makeBoolOpNode(ast);
  } else if (ast._astname === "Compare") {
    return makeCompareNode(ast);
  } else if (ast._astname === "If") {
    return makeIfNode(ast);
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
