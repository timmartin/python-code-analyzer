import {
  DefaultPortModel,
  PortModelAlignment,
} from "@projectstorm/react-diagrams";
import { NodeModel } from "@projectstorm/react-diagrams-core";

interface Property {
  name: string;
  value: string | number | DefaultPortModel;
}

type ArrayEntry = string | number | DefaultPortModel;

// Node model for showing a node in a tree of Python objects in a
// running Python program.
export default class ObjectTreeNodeModel extends NodeModel {
  public readonly name: string;

  public inPort: DefaultPortModel;

  public properties: Property[] = [];

  public arrayEntries: ArrayEntry[] = [];

  constructor(name?: string) {
    super({
      type: "object-tree",
    });

    this.name = name;
    this.height = 40;
    this.width = 100;

    this.inPort = new DefaultPortModel({
      in: true,
      name: "input",
      label: "",
      alignment: PortModelAlignment.LEFT,
    });

    super.addPort(this.inPort);
  }

  public addPropertyValue(label: string, value: string | number): void {
    this.properties.push({ name: label, value });

    this.height += 32;
  }

  // Add a property that links elsewhere, so has a port assigned to it.
  public addPropertyPort(label: string): DefaultPortModel {
    // Value is another object; it can't be displayed inline, we have
    // to create another object and a port on this object to link to it.
    const port = new DefaultPortModel({
      in: false,
      name: label,
      label: label,
      alignment: PortModelAlignment.RIGHT,
    });
    super.addPort(port);

    this.properties.push({ name: label, value: port });
    this.height += 32;

    return port;
  }

  public addArrayValue(value: string | number): void {
    this.arrayEntries.push(value);
    this.height += 32;
  }

  public addArrayPort(): DefaultPortModel {
    const port = new DefaultPortModel({
      in: false,
      name: this.arrayEntries.length.toString(),
      alignment: PortModelAlignment.RIGHT,
    });
    super.addPort(port);

    this.arrayEntries.push(port);
    this.height += 32;

    return port;
  }
}
