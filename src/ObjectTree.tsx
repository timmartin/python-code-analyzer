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

interface PythonObject {
  name: string;

  // Properties with values that are built-in types and can be displayed
  // inline rather than linking to a separate object.
  inlineProperties: Record<string, string | number>;

  // Properties whose value is another node in the object tree.
  linkedProperties: Record<string, string>;
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

    for (const inlinePropertyName of Object.getOwnPropertyNames(
      pythonObject.inlineProperties
    )) {
      const inlineProperty = pythonObject.inlineProperties[inlinePropertyName];
      node.addPropertyValue(inlinePropertyName, inlineProperty);
    }

    for (const linkedPropertyName of Object.getOwnPropertyNames(
      pythonObject.linkedProperties
    )) {
      const port = node.addPropertyPort(linkedPropertyName);
      linkedProperties.push({port, target: pythonObject.linkedProperties[linkedPropertyName]});
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
