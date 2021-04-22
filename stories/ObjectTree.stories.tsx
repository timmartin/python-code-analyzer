import * as React from "react";

import ObjectTree, { PythonObject } from "../src/ObjectTree";

export default {
  title: "Object tree",
  component: ObjectTree,
};

export const LinkedNodes: React.FC = () => {
  const objectModel: Record<string, PythonObject> = {
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
  const objectModel: Record<string, PythonObject> = {
    lunch: {
      name: "lunch",
      properties: {},
      arrayValues: [
        { valueType: "linked", objectRef: "fruits" },
        { valueType: "linked", objectRef: "drinks" },
      ],
    },
    fruits: {
      name: "fruits",
      properties: {},
      arrayValues: [
        { valueType: "inline", value: "apple" },
        { valueType: "inline", value: "banana" },
        { valueType: "inline", value: "cherry" },
      ],
    },
    drinks: {
      name: "drinks",
      properties: {},
      arrayValues: [
        { valueType: "inline", value: "water" },
        { valueType: "inline", value: "cola" },
      ],
    },
  };

  return <ObjectTree objects={objectModel} />;
};

// Object trees can have loops in them, though it looks pretty bad
export const LoopedObjects: React.FC = () => {
  const objectModel: Record<string, PythonObject> = {
    foo: {
      name: "foo",
      properties: {
        next: { valueType: "linked" as const, objectRef: "bar" },
      },
      arrayValues: [],
    },
    bar: {
      name: "bar",
      properties: {
        next: { valueType: "linked" as const, objectRef: "baz" },
      },
      arrayValues: [],
    },
    baz: {
      name: "baz",
      properties: {
        next: { valueType: "linked" as const, objectRef: "foo" },
      },
      arrayValues: [],
    },
  };

  return <ObjectTree objects={objectModel} />;
};
