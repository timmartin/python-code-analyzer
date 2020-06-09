import * as React from "react";
import * as Sk from "skulpt";

import ParseTree from "../src/ParseTree";

export default {
  title: "Parse tree",
  component: ParseTree,
};

export const Default = () => {
  return <ParseTree code="a = 42 + 1" />;
};
