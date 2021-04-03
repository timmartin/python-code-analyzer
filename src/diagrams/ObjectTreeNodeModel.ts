import {
  DefaultPortModel,
  PortModelAlignment,
} from "@projectstorm/react-diagrams";
import { NodeModel } from "@projectstorm/react-diagrams-core";

// Node model for showing a node in a tree of Python objects in a
// running Python program.
export default class ObjectTreeNodeModel extends NodeModel {
  public readonly name: string;

  public inPort: DefaultPortModel;

  public propertyPorts: DefaultPortModel[] = [];

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

  public addProperty(label: string): DefaultPortModel {
    const port = new DefaultPortModel({
      in: false,
      name: label,
      label: label,
      alignment: PortModelAlignment.RIGHT,
    });

    return this.addPropertyPort(port);
  }

  public addPropertyPort(port: DefaultPortModel): DefaultPortModel {
    super.addPort(port);
    this.height += 20;
    this.propertyPorts.push(port);
    return port;
  }
}
