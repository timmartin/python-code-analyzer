import * as React from "react";

import ParseTree from "../src/ParseTree";

export default {
  title: "Parse tree",
  component: ParseTree,
};

export const Default = (): React.ReactNode => {
  return <ParseTree code="a = 42 + 1" />;
};
