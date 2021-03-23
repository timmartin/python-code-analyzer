export interface ASTLoad {
  _astname: "Load";
}

export interface ASTStore {
  _astname: "Store";
}

export interface ASTDel {
  _astname: "Del";
}

export interface ASTAugLoad {
  _astname: "AugLoad";
}

export interface ASTAugStore {
  _astname: "AugStore";
}

export interface ASTParam {
  _astname: "Param";
}

export interface ASTAssign {
  _astname: "Assign";
  value: ASTNode;
  targets: ASTNode[];
}

export interface ASTAugAssign {
  _astname: "AugAssign";
  target: ASTNode;
  op: ASTNode;
  value: ASTNode;
}

export interface ASTAnnAssign {
  _astname: "AnnAssign";
  target: ASTNode;
  annotation: ASTNode;
  value: ASTNode;
}

export interface ASTFor {
  _astname: "For";
  target: ASTNode;
  iter: ASTNode;
  body: ASTNode;
  orelse: ASTNode;
}

export interface ASTAsyncFor {
  _astname: "AsyncFor";
  target: ASTNode;
  iter: ASTNode;
  body: ASTNode;
  orelse: ASTNode;
}

export interface ASTWhile {
  _astname: "While";
  test: ASTNode;
  body: ASTNode;
  orelse: ASTNode;
}

export interface ASTIf {
  _astname: "If";
  test: ASTNode;
  body: ASTNode[];
  orelse: ASTNode[];
}

export interface ASTWith {
  _astname: "With";
  items: ASTNode[];
  body: ASTNode[];
}

export interface ASTAsyncWith {
  _astname: "AsyncWith";
  items: ASTNode[];
  body: ASTNode[];
}

export interface ASTRaise {
  _astname: "Raise";
}

export interface ASTTry {
  _astname: "Try";
}

export interface ASTAssert {
  _astname: "Assert";
}

export interface ASTImport {
  _astname: "Import";
}

export interface ASTImportFrom {
  _astname: "ImportFrom";
}

export interface ASTGlobal {
  _astname: "Global";
  names: ASTNode[];
}

export interface ASTNonLocal {
  _astname: "NonLocal";
  names: ASTNode[];
}

export interface ASTExpr {
  _astname: "Expr";
  value: ASTNode[];
}

export interface ASTPass {
  _astname: "Pass";
}

export interface ASTBreak {
  _astname: "Break";
}

export interface ASTContinue {
  _astname: "Continue";
}

export interface ASTPrint {
  _astname: "Print";
  dest: ASTNode;
  values: ASTNode[];
}

export interface ASTLambda {
  _astname: "Lambda";
  args: ASTNode[];
  body: ASTNode[];
}

export interface ASTIfExp {
  _astname: "IfExp";
  test: ASTNode;
  body: ASTNode;
  orelse: ASTNode;
}

export interface ASTDict {
  _astname: "Dict";
  keys: ASTNode[];
  values: ASTNode[];
}

export interface ASTSet {
  _astname: "Set";
  elts: ASTNode[];
}

export interface ASTListComp {
  _astname: "ListComp";
  elt: ASTNode;
  generators: ASTNode[];
}

export interface ASTSetComp {
  _astname: "SetComp";
  elt: ASTNode;
  generators: ASTNode[];
}

export interface ASTDictComp {
  _astname: "DictComp";
  key: ASTNode;
  value: ASTNode;
  generators: ASTNode[];
}

export interface ASTGeneratorExp {
  _astname: "GeneratorExp";
  elt: ASTNode;
  generators: ASTNode[];
}

export interface ASTAwait {
  _astname: "Await";
  value: ASTNode;
}

export interface ASTYield {
  _astname: "Yield";
  value: ASTNode;
}

export interface ASTYieldFrom {
  _astname: "YieldFrom";
  value: ASTNode;
}

export interface ASTCall {
  _astname: "Call";
  func: ASTNode;
  args: ASTNode[];
}

export interface ASTNum {
  _astname: "Num";
  n: object;
}

export interface ASTStr {
  _astname: "Str";
  s: object;
}

export interface ASTFormattedValue {
  _astname: "FormattedValue";
  value: ASTNode;
  conversion: number;
  format_spec: ASTNode;
}

export interface ASTJoinedStr {
  _astname: "JoinedStr";
  values: ASTNode[];
}

export interface ASTBytes {
  _astname: "Bytes";
}

export interface ASTNameConstant {
  _astname: "NameConstant";
}

export interface ASTEllipsis {
  _astname: "Ellipsis";
}

export interface ASTConstant {
  _astname: "Constant";
}

export interface ASTAttribute {
  _astname: "Attribute";
  value: ASTNode;
}

export interface ASTSubscript {
  _astname: "Subscript";
  value: ASTNode;
  slice: ASTNode;
}

export interface ASTStarred {
  _astname: "Starred";
  value: ASTNode;
}

export interface ASTName {
  _astname: "Name";
  id: object;
}

export interface ASTList {
  _astname: "List";
}

export interface ASTTuple {
  _astname: "Tuple";
}

export interface ASTSlice {
  _astname: "Slice";
  lower: ASTNode;
  upper: ASTNode;
  step: ASTNode;
}

export interface ASTExtSlice {
  _astname: "ExtSlice";
  dims: ASTNode[];
}

export interface ASTIndex {
  _astname: "Index";
  value: ASTNode;
}

export interface ASTBinOp {
  _astname: "BinOp";
  left: ASTNode;
  op: typeof BinaryOperatorClass;
  right: ASTNode;
}

export interface ASTUnaryOp {
  _astname: "UnaryOp";
  op: typeof UnaryOperatorClass;
  operand: ASTNode;
}

export interface ASTModule {
  _astname: "Module";
  body: ASTNode[];
  docstring: string;
}

export interface ASTInteractive {
  _astname: "Interactive";
  body: ASTNode[];
}

export interface ASTExpression {
  _astname: "Expression";
  body: ASTNode[];
}

export interface ASTSuite {
  _astname: "Suite";
  body: ASTNode[];
}

type BinaryOperatorASTName =
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
export interface ASTOperator {
  _astname: BinaryOperatorASTName;
}

// This is a bit of a hack. The AST produced by Skulpt contains either objects
// or classes, depending on the node type; in the case of simple nodes with no
// members, the class is inserted into the AST. In order to represent the type
// of this, we declare our own class and pretend that we have one of those.
class BinaryOperatorClass implements ASTOperator {
  _astname: BinaryOperatorASTName;
}

export interface ASTBooleanOperator {
  _astname: "And" | "Or";
}

class BooleanOperatorClass implements ASTBooleanOperator {
  _astname: "And" | "Or";
}

export interface ASTBoolOp {
  _astname: "BoolOp";
  op: typeof BooleanOperatorClass;
  values: ASTNode[];
}

type UnaryOpASTName = "Invert" | "Not" | "UAdd" | "USub";

export interface ASTUnaryOperator {
  _astname: UnaryOpASTName;
}

class UnaryOperatorClass implements ASTUnaryOperator {
  _astname: UnaryOpASTName;
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

export interface ASTCompareOp {
  _astname: CompareASTName;
}

class CompareOperatorClass implements ASTCompareOp {
  _astname: CompareASTName;
}

export interface ASTCompare {
  _astname: "Compare";
  left: ASTNode;
  ops: typeof CompareOperatorClass[];
  comparators: ASTNode[];
}

export interface ASTFunctionDef {
  _astname: "FunctionDef";
  name: string;
  args: ASTNode[];
  body: ASTNode[];
  decorator_list: ASTNode[];
  returns: ASTNode;
  docstring: string;
}

export interface ASTAsyncFunctionDef {
  _astname: "AsyncFunctionDef";
  name: string;
  args: ASTNode[];
  body: ASTNode[];
  decorator_list: ASTNode[];
  returns: ASTNode;
  docstring: string;
}

export interface ASTClassDef {
  _astname: "ClassDef";
}

export interface ASTReturn {
  _astname: "Return";
  value: ASTNode;
}

export interface ASTDelete {
  _astname: "Delete";
  targets: ASTNode[];
}

export type ASTNode =
  | ASTName
  | ASTNum
  | ASTModule
  | ASTOperator
  | ASTBooleanOperator
  | ASTCompare
  | ASTCompareOp
  | ASTFunctionDef
  | ASTAsyncFunctionDef
  | ASTReturn
  | ASTDelete
  | ASTAssign
  | ASTAugAssign
  | ASTAnnAssign
  | ASTFor
  | ASTAsyncFor
  | ASTWhile
  | ASTIf
  | ASTWith
  | ASTAsyncWith
  | ASTRaise
  | ASTTry
  | ASTAssert
  | ASTImport
  | ASTImportFrom
  | ASTGlobal
  | ASTNonLocal
  | ASTExpr
  | ASTPass
  | ASTBreak
  | ASTContinue
  | ASTPrint
  | ASTBoolOp
  | ASTBinOp
  | ASTUnaryOp
  | ASTLambda
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
  | ASTSubscript
  | ASTStarred
  | ASTList
  | ASTTuple
  | ASTLoad
  | ASTStore
  | ASTDel
  | ASTAugLoad
  | ASTAugStore
  | ASTParam
  | ASTSlice
  | ASTExtSlice
  | ASTIndex
  | ASTUnaryOperator
  | ASTInteractive
  | ASTExpression
  | ASTSuite
  | ASTClassDef;

export function isASTOperator(node: ASTNode): node is ASTOperator {
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

export function isBooleanOperator(node: ASTNode): node is ASTBooleanOperator {
  return node._astname === "And" || node._astname === "Or";
}

export function isCompareOperator(node: ASTNode): node is ASTCompareOp {
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

export function isUnaryOperator(node: ASTNode): node is ASTUnaryOperator {
  return (
    node._astname === "Invert" ||
    node._astname === "Not" ||
    node._astname === "UAdd" ||
    node._astname === "USub"
  );
}
