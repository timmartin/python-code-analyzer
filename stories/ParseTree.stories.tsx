import * as React from "react";
import * as Sk from "skulpt";

import ParseTree from "../src/ParseTree";

export default {
  title: "Parse tree",
  component: ParseTree,
};

export const Default = () => {
  const parse = Sk.parse("<str>", "a = 42 + 1\n");
  const ast = Sk.astFromParse(parse.cst, "<str>");

  return <ParseTree ast={ast.body} />;
};
