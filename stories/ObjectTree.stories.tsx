import * as React from "react";

import ObjectTree from "../src/ObjectTree";

export default {
  title: "Object tree",
  component: ObjectTree,
};

export const LinkedNodes: React.FC = () => {
  const objectModel = {
    foo: {
      name: "Foo",
      properties: {
        bar: { valueType: "inline" as const, value: 42 },
        baz: { valueType: "inline" as const, value: "qux" },
      },
      arrayValues: [],
    },
    bar: {
      name: "Bar",
      properties: {
        next: { valueType: "linked" as const, objectRef: "foo" },
      },
      arrayValues: [],
    },
  };

  return <ObjectTree objects={objectModel} />;
};

export const ArrayNode: React.FC = () => {
  const objectModel = {
    foo: {
      name: "foo",
      properties: {},
      arrayValues: [],
    },
  };

  return <ObjectTree objects={objectModel} />;
};
