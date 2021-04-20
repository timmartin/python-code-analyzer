// Component to display a diagram of a Python object tree, i.e. the
// state of live objects in an executing Python program and the
// relationships between them.

import React, { useMemo } from "react";
import createEngine, {
  DagreEngine,
  DiagramModel,
} from "@projectstorm/react-diagrams";
import { CanvasWidget } from "@projectstorm/react-canvas-core";

import ObjectTreeNodeFactory from "./diagrams/ObjectTreeNodeFactory";
import ObjectTreeNodeModel from "./diagrams/ObjectTreeNodeModel";
import { assertNever } from "./utils";

// A value that a property can have that will be inline in the object
// that owns it.
interface InlineValue {
  valueType: "inline";
  value: string | number;
}

// A value that a property can have that will be linked to another
// python object in the object tree
interface LinkedValue {
  valueType: "linked";

  // This is a reference to the linked object, in the form of a name
  // in the namespace of the collection that represents the object tree
  // (which may not be the same as any real Python namespace in the
  // code we're representing)
  objectRef: string;
}

type PythonValue = InlineValue | LinkedValue;

export interface PythonObject {
  name: string;

  properties: Record<string, PythonValue>;

  arrayValues: PythonValue[];
}

export interface Props {
  objects: Record<string, PythonObject>;
}

export const ObjectTree: React.FC<Props> = ({ objects }: Props) => {
  const engine = useMemo(() => {
    const engine = createEngine();
    engine.getNodeFactories().registerFactory(new ObjectTreeNodeFactory());
    return engine;
  }, []);

  const model = new DiagramModel();
  engine.setModel(model);

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

  const linkedProperties = [];
  const modelObjects = {};

  for (const objectName of Object.getOwnPropertyNames(objects)) {
    const pythonObject = objects[objectName];
    const node = new ObjectTreeNodeModel(pythonObject.name);

    for (const propertyName of Object.getOwnPropertyNames(
      pythonObject.properties
    )) {
      const property = pythonObject.properties[propertyName];

      if (property.valueType === "inline") {
        node.addPropertyValue(propertyName, property.value);
      } else if (property.valueType === "linked") {
        const port = node.addPropertyPort(propertyName);
        linkedProperties.push({
          port,
          target: property.objectRef,
        });
      } else {
        assertNever(property);
      }
    }

    for (const arrayEntry of pythonObject.arrayValues) {
      if (arrayEntry.valueType === "inline") {
        node.addArrayValue(arrayEntry.value);
      } else if (arrayEntry.valueType === "linked") {
        const port = node.addArrayPort();
        linkedProperties.push({ port, target: arrayEntry.objectRef });
      } else {
        assertNever(arrayEntry);
      }
    }

    model.addNode(node);
    modelObjects[objectName] = node;
  }

  for (const link of linkedProperties) {
    const targetObject = modelObjects[link.target];
    model.addLink(link.port.link(targetObject.inPort));
  }

  routingEngine.redistribute(model);

  return (
    <div className="python-analyzer-view object-tree">
      <CanvasWidget engine={engine} className="block-diagram-canvas" />
    </div>
  );
};

export default ObjectTree;
