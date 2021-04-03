import * as React from "react";

import ParseTree from "../src/ParseTree";

export default {
  title: "Parse tree",
  component: ParseTree,
};

export const Default: React.FC = () => (
  <ParseTree code="a = 42 + 1" />
);

export const Module = (): React.ReactNode  => {
  const code = "a = b + 1\nb = 3";
  return <ParseTree code={code} mode="module" />;
};

export const BoolOp = (): React.ReactNode => {
  const code = "value = a and b and c";
  return <ParseTree code={code} />;
}

export const Comparison = (): React.ReactNode => {
  const code = "value = a < 3 < b";
  return <ParseTree code={code} />;
}

export const IfBlock = (): React.ReactNode => {
  const code = "if a < b:\n    a = 1\nelse:\n    b = 1";
  return <ParseTree code={code} mode="module" />;
}

export const FunctionDef = (): React.ReactNode => {
  const code = "def foo(bar):\n    return 42"
  return <ParseTree code={code} />;
}
