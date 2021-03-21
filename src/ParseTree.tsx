import * as React from "react";
import { useMemo } from "react";
import Sk from "@timmartin2/skulpt";

import createEngine, {
  DagreEngine,
  DiagramModel,
  DefaultLinkModel,
} from "@projectstorm/react-diagrams";
import { CanvasWidget } from "@projectstorm/react-canvas-core";

import { assertNever, joinArrays } from "./utils";
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
  ops: typeof CompareOperatorClass[];
  comparators: ASTNode[];
}

interface ASTIf {
  _astname: "If";
  test: ASTNode;
  body: ASTNode[];
  orelse: ASTNode[];
}

interface ASTFunctionDef {
  _astname: "FunctionDef";
  name: string;
  args: ASTNode[];
  body: ASTNode[];
  decorator_list: ASTNode[];
  returns: ASTNode;
  docstring: string;
}

interface ASTAsyncFunctionDef {
  _astname: "AsyncFunctionDef";
  name: string;
  args: ASTNode[];
  body: ASTNode[];
  decorator_list: ASTNode[];
  returns: ASTNode;
  docstring: string;
}

interface ASTReturn {
  _astname: "Return";
  value: ASTNode;
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
  | ASTIf
  | ASTFunctionDef
  | ASTAsyncFunctionDef
  | ASTReturn;

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

function makeSubTree(
  parentNode: ASTNodeModel,
  astNode: ASTNode,
  label: string,
  childNodes: ASTNodeModel[][],
  childLinks: DefaultLinkModel[][]
): void {
  const port = parentNode.addSubtreePort(label);

  const [
    comparatorNode,
    comparatorChildNodes,
    comparatorChildLinks,
  ] = makeASTNode(astNode);

  childNodes.push([comparatorNode]);
  childNodes.push(comparatorChildNodes);

  childLinks.push([port.link(comparatorNode.inPort)]);
  childLinks.push(comparatorChildLinks);
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
  const links: DefaultLinkModel[][] = [];
  const nodes: ASTNodeModel[][] = [];

  const mainNode = new ASTNodeModel("Assign");

  makeSubTree(mainNode, ast.value, "Value", nodes, links);
  makeSubTree(mainNode, ast.targets[0], "Target", nodes, links);

  return [mainNode, joinArrays(nodes), joinArrays(links)];
};

const makeOperatorNode: NodeRenderer<
  ASTOperator | ASTBooleanOperator | ASTCompareOp
> = (ast) => {
  const node = new ASTNodeModel(ast._astname);

  return [node, [], []];
};

const makeBoolOpNode: NodeRenderer<ASTBoolOp> = (ast) => {
  const node = new ASTNodeModel("Boolean Op");

  const links: DefaultLinkModel[][] = [];
  const nodes: ASTNodeModel[][] = [];

  const [opNode, opChildNodes, opChildLinks] = makeASTNode(new ast.op());

  nodes.push([opNode]);
  nodes.push(opChildNodes);
  links.push(opChildLinks);

  const operatorPort = node.addSubtreePort("Operator");
  links.push([operatorPort.link(opNode.inPort)]);

  ast.values.forEach((value, index) => {
    makeSubTree(node, value, `value ${index}`, nodes, links);
  });

  return [node, joinArrays(nodes), joinArrays(links)];
};

const makeCompareNode: NodeRenderer<ASTCompare> = (ast) => {
  const node = new ASTNodeModel("Comparison");

  const links: DefaultLinkModel[][] = [];
  const nodes: ASTNodeModel[][] = [];

  const [leftNode, leftChildNodes, leftChildLinks] = makeASTNode(ast.left);

  nodes.push([leftNode]);
  nodes.push(leftChildNodes);
  links.push(leftChildLinks);

  const leftPort = node.addSubtreePort("Left");
  links.push([leftPort.link(leftNode.inPort)]);

  ast.comparators.forEach((comparator, index) => {
    makeSubTree(node, comparator, `Comparator ${index}`, nodes, links);
  });

  ast.ops.forEach((operator, index) => {
    makeSubTree(node, new operator(), `Operator ${index}`, nodes, links);
  });

  return [node, joinArrays(nodes), joinArrays(links)];
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

const makeFunctionDefNode: NodeRenderer<
  ASTFunctionDef | ASTAsyncFunctionDef
> = (ast) => {
  const node = new ASTNodeModel(ast._astname);

  const childNodes: ASTNodeModel[][] = [];
  const childLinks: DefaultLinkModel[][] = [];

  node.addSubtreePort(`Name: ${Sk.ffi.remapToJs(ast.name)}`);

  const bodyPort = node.addSubtreePort("Body");

  ast.body.forEach((statement) => {
    const [
      statementNode,
      statementChildNodes,
      statementChildLinks,
    ] = makeASTNode(statement);

    childNodes.push([statementNode]);
    childNodes.push(statementChildNodes);
    childLinks.push(statementChildLinks);

    childLinks.push([bodyPort.link(statementNode.inPort)]);
  });

  return [node, joinArrays(childNodes), joinArrays(childLinks)];
};

const makeReturnNode: NodeRenderer<ASTReturn> = (ast) => {
  const node = new ASTNodeModel("Return");

  const childNodes: ASTNodeModel[][] = [];
  const childLinks: DefaultLinkModel[][] = [];

  makeSubTree(node, ast.value, "Value", childNodes, childLinks);

  return [node, joinArrays(childNodes), joinArrays(childLinks)];
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
  } else if (
    ast._astname === "FunctionDef" ||
    ast._astname === "AsyncFunctionDef"
  ) {
    return makeFunctionDefNode(ast);
  } else if (ast._astname === "Return") {
    return makeReturnNode(ast);
  } else {
    assertNever(ast);
  }
};

const ParseTree = ({ code, mode = "statement" }: ParseTreeProps): React.ReactNode => {
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
  let ast = Sk.astFromParse(parse.cst, "<str>");
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
