import * as React from "react";

import {
  AbstractReactFactory,
  GenerateWidgetEvent,
} from "@projectstorm/react-canvas-core";

import ObjectTreeNodeWidget from "./ObjectTreeNodeWidget";
import { DiagramEngine } from "@projectstorm/react-diagrams";
import ObjectTreeNodeModel from "./ObjectTreeNodeModel";

export default class ObjectTreeNodeFactory extends AbstractReactFactory<
  ObjectTreeNodeModel,
  DiagramEngine
> {
  constructor() {
    super("object-tree");
  }

  generateReactWidget(event: GenerateWidgetEvent<ObjectTreeNodeModel>): JSX.Element {
    return <ObjectTreeNodeWidget node={event.model} engine={this.engine} />;
  }

  generateModel(): ObjectTreeNodeModel {
    return new ObjectTreeNodeModel();
  }
}
