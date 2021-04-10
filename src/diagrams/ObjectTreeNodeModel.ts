import {
  DefaultPortModel,
  PortModelAlignment,
} from "@projectstorm/react-diagrams";
import { NodeModel } from "@projectstorm/react-diagrams-core";

interface Property {
  name: string;
  value: string | number | DefaultPortModel;
}

// Node model for showing a node in a tree of Python objects in a
// running Python program.
export default class ObjectTreeNodeModel extends NodeModel {
  public readonly name: string;

  public inPort: DefaultPortModel;

  public properties: Property[] = [];

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

  public addProperty(label: string, value?: string | number): void {
    if (value === undefined) {
      // Value is another object; it can't be displayed inline, we have
      // to create another object and a port on this object to link to it.
      const port = new DefaultPortModel({
        in: false,
        name: label,
        label: label,
        alignment: PortModelAlignment.RIGHT,
      });
      super.addPort(port);

      this.properties.push({name: label, value: port});
    } else {
      this.properties.push({name: label, value});
    }

    this.height += 20;
  }
}
