import * as React from "react";
import {
  AbstractReactFactory,
  GenerateWidgetEvent,
} from "@projectstorm/react-canvas-core";

import ASTNodeModel from "./ASTNodeModel";
import ASTNodeWidget from "./ASTNodeWidget";
import { DiagramEngine } from "@projectstorm/react-diagrams";

export class ASTNodeFactory extends AbstractReactFactory<
  ASTNodeModel,
  DiagramEngine
> {
  constructor() {
    super("ast");
  }

  generateReactWidget(event: GenerateWidgetEvent<ASTNodeModel>): JSX.Element {
    return <ASTNodeWidget node={event.model} engine={this.engine} />;
  }

  generateModel(): ASTNodeModel {
    return new ASTNodeModel();
  }
}
