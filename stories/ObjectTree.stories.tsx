import * as React from "react";

import ObjectTree from "../src/ObjectTree";

export default {
  title: "Object tree",
  component: ObjectTree,
};

export const Default: React.FC = () => {
  const objectModel = {
    foo: {
      name: "Foo",
      inlineProperties: {
        bar: 42,
        baz: "qux",
      },
      linkedProperties: {},
    },
  };

  return <ObjectTree objects={objectModel} />;
};
