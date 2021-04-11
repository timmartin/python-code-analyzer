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
import {
  ASTAnnAssign,
  ASTAssert,
  ASTAssign,
  ASTAsyncFor,
  ASTAsyncFunctionDef,
  ASTAsyncWith,
  ASTAttribute,
  ASTAugAssign,
  ASTAugLoad,
  ASTAugStore,
  ASTAwait,
  ASTBinOp,
  ASTBooleanOperator,
  ASTBoolOp,
  ASTBreak,
  ASTBytes,
  ASTCall,
  ASTClassDef,
  ASTCompare,
  ASTCompareOp,
  ASTConstant,
  ASTContinue,
  ASTDel,
  ASTDelete,
  ASTDict,
  ASTDictComp,
  ASTEllipsis,
  ASTExpr,
  ASTExpression,
  ASTExtSlice,
  ASTFor,
  ASTFormattedValue,
  ASTFunctionDef,
  ASTGeneratorExp,
  ASTGlobal,
  ASTIf,
  ASTIfExp,
  ASTImport,
  ASTImportFrom,
  ASTIndex,
  ASTInteractive,
  ASTJoinedStr,
  ASTLambda,
  ASTList,
  ASTListComp,
  ASTLoad,
  ASTModule,
  ASTName,
  ASTNameConstant,
  ASTNode,
  ASTNonLocal,
  ASTNum,
  ASTOperator,
  ASTParam,
  ASTPass,
  ASTPrint,
  ASTRaise,
  ASTReturn,
  ASTSet,
  ASTSetComp,
  ASTSlice,
  ASTStarred,
  ASTStore,
  ASTStr,
  ASTSubscript,
  ASTSuite,
  ASTTry,
  ASTTuple,
  ASTUnaryOp,
  ASTUnaryOperator,
  ASTWhile,
  ASTWith,
  ASTYield,
  ASTYieldFrom,
  isASTOperator,
  isBooleanOperator,
  isCompareOperator,
  isUnaryOperator,
} from "./ast";
import { ASTNodeFactory } from "./diagrams/ASTNodeFactory";
import ASTNodeModel from "./diagrams/ASTNodeModel";

// Function type for turning an AST node into entries on the diagram
//
// The function returns a tuple of:
// - The diagram node that directly corresponds to the AST node
// - An array of sub-nodes in the child tree
// - An array of links in the child tree
type NodeRenderer<T extends ASTNode> = (
  ast: T
) => [ASTNodeModel, ASTNodeModel[], DefaultLinkModel[]];

export interface ParseTreeProps {
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

const makeNumberNode: NodeRenderer<ASTNum> = (ast) => {
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

const makeAssignmentNode: NodeRenderer<ASTAssign> = (ast) => {
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

// Handle cases of AST nodes that we don't have any specialised handling
// of. This just draws a box with a label that is the node type.
// Child nodes will not be rendered, so this isn't very useful but will
// at least ensure that we don't crash on unrecognised node types.
const makeGenericNode: NodeRenderer<
  | ASTLoad
  | ASTStore
  | ASTUnaryOp
  | ASTDelete
  | ASTAugAssign
  | ASTAnnAssign
  | ASTFor
  | ASTAsyncFor
  | ASTWhile
  | ASTAssert
  | ASTWith
  | ASTAsyncWith
  | ASTRaise
  | ASTTry
  | ASTImport
  | ASTImportFrom
  | ASTGlobal
  | ASTNonLocal
  | ASTBreak
  | ASTExpr
  | ASTPass
  | ASTContinue
  | ASTLambda
  | ASTPrint
  | ASTIfExp
  | ASTDict
  | ASTSet
  | ASTListComp
  | ASTSetComp
  | ASTDictComp
  | ASTGeneratorExp
  | ASTAwait
  | ASTYield
  | ASTYieldFrom
  | ASTCall
  | ASTStr
  | ASTFormattedValue
  | ASTJoinedStr
  | ASTBytes
  | ASTNameConstant
  | ASTEllipsis
  | ASTConstant
  | ASTAttribute
  | ASTStarred
  | ASTSubscript
  | ASTList
  | ASTTuple
  | ASTDel
  | ASTAugLoad
  | ASTAugStore
  | ASTParam
  | ASTSlice
  | ASTExtSlice
  | ASTIndex
  | ASTInteractive
  | ASTExpression
  | ASTSuite
  | ASTClassDef
  | ASTUnaryOperator
> = (ast) => {
  return [new ASTNodeModel(ast._astname), [], []];
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
  } else if (
    ast._astname === "Load" ||
    ast._astname === "Store" ||
    ast._astname === "UnaryOp" ||
    ast._astname === "Delete" ||
    ast._astname === "AugAssign" ||
    ast._astname === "AnnAssign" ||
    ast._astname === "For" ||
    ast._astname === "AsyncFor" ||
    ast._astname === "While" ||
    ast._astname === "Assert" ||
    ast._astname === "AsyncWith" ||
    ast._astname === "Raise" ||
    ast._astname === "Try" ||
    ast._astname === "With" ||
    ast._astname === "Import" ||
    ast._astname === "ImportFrom" ||
    ast._astname === "Global" ||
    ast._astname === "NonLocal" ||
    ast._astname === "Pass" ||
    ast._astname === "Expr" ||
    ast._astname === "Break" ||
    ast._astname === "Continue" ||
    ast._astname === "Lambda" ||
    ast._astname === "Print" ||
    ast._astname === "IfExp" ||
    ast._astname === "Dict" ||
    ast._astname === "Set" ||
    ast._astname === "ListComp" ||
    ast._astname === "SetComp" ||
    ast._astname === "DictComp" ||
    ast._astname === "GeneratorExp" ||
    ast._astname === "Await" ||
    ast._astname === "Yield" ||
    ast._astname === "YieldFrom" ||
    ast._astname === "Call" ||
    ast._astname === "Str" ||
    ast._astname === "FormattedValue" ||
    ast._astname === "JoinedStr" ||
    ast._astname === "Bytes" ||
    ast._astname === "NameConstant" ||
    ast._astname === "Ellipsis" ||
    ast._astname === "Constant" ||
    ast._astname === "Attribute" ||
    ast._astname === "Starred" ||
    ast._astname === "Subscript" ||
    ast._astname === "List" ||
    ast._astname === "Tuple" ||
    ast._astname === "Del" ||
    ast._astname === "AugLoad" ||
    ast._astname === "AugStore" ||
    ast._astname === "Param" ||
    ast._astname === "Slice" ||
    ast._astname === "ExtSlice" ||
    ast._astname === "Index" ||
    ast._astname === "Interactive" ||
    ast._astname === "Expression" ||
    ast._astname === "Suite" ||
    ast._astname === "ClassDef" ||
    isUnaryOperator(ast)
  ) {
    return makeGenericNode(ast);
  } else {
    assertNever(ast);
  }
};

const ParseTree: React.FC<ParseTreeProps> = ({
  code,
  mode = "statement",
}: ParseTreeProps) => {
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
