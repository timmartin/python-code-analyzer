import * as React from "react";

import ParseTree from "../src/ParseTree";

export default {
  title: "Parse tree",
  component: ParseTree,
};

export const Default = (): React.ReactNode => (
  <ParseTree code="a = 42 + 1" />
);

export const Module = (): React.ReactNode  => {
  const code = "a = b + 1\nb = 3";
  return <ParseTree code={code} mode="module" />;
};
