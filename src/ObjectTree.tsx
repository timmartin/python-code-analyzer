// Component to display a diagram of a Python object tree, i.e. the
// state of live objects in an executing Python program and the
// relationships between them.

import React, { useMemo } from "react";
import createEngine, { DiagramModel } from "@projectstorm/react-diagrams";
import { CanvasWidget } from "@projectstorm/react-canvas-core";

import ObjectTreeNodeFactory from "./diagrams/ObjectTreeNodeFactory";
import ObjectTreeNodeModel from "./diagrams/ObjectTreeNodeModel";

export const ObjectTree: React.FC = () => {
  const engine = useMemo(() => {
    const engine = createEngine();
    engine.getNodeFactories().registerFactory(new ObjectTreeNodeFactory());
    return engine;
  }, []);

  const model = new DiagramModel();
  engine.setModel(model);

  model.addNode(new ObjectTreeNodeModel("Foo"));

  return (
    <div className="python-analyzer-view object-tree">
      <CanvasWidget engine={engine} className="block-diagram-canvas" />
    </div>
  );
};

export default ObjectTree;
