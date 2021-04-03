import { DefaultPortModel, PortModelAlignment } from "@projectstorm/react-diagrams";
import { NodeModel } from "@projectstorm/react-diagrams-core";

// Node model for showing a node in a tree of Python objects in a
// running Python program.
export default class ObjectTreeNodeModel extends NodeModel {
  public readonly name: string;

  public inPort: DefaultPortModel;

  constructor(name?: string) {
    super({
      type: "object-tree",
    });

    this.name = name;

    this.inPort = new DefaultPortModel({
      in: true,
      name: "input",
      label: "",
      alignment: PortModelAlignment.LEFT,
    });

    super.addPort(this.inPort);
  }
}
