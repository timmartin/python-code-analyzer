import {
  NodeModel,
  DefaultPortModel,
  PortModelAlignment,
} from "@projectstorm/react-diagrams";

// The AST node model models a node in a Python Abstract Syntax Tree. The nodes don't
// have (visible) input ports.
export default class ASTNodeModel extends NodeModel {
  public name: string;

  public subtreePorts: DefaultPortModel[];

  public inPort: DefaultPortModel;

  public value: string | undefined;

  constructor(name?: string, value?: string) {
    super({
      type: "ast",
    });

    this.height = 40;
    this.width = 100;
    this.subtreePorts = [];
    this.value = value;

    if (name !== undefined) {
      this.name = name;
    } else {
      this.name = "Unnamed";
    }

    this.inPort = new DefaultPortModel({
      in: true,
      name: "input",
      label: "",
      alignment: PortModelAlignment.LEFT,
    });

    super.addPort(this.inPort);
  }

  addPort<T extends DefaultPortModel>(port: T): T {
    super.addPort(port);
    this.height += 20;
    this.subtreePorts.push(port);
    return port;
  }

  addSubtreePort(label: string): DefaultPortModel {
    const port = new DefaultPortModel({
      in: false,
      name: label,
      label: label,
      alignment: PortModelAlignment.RIGHT,
    });

    return this.addPort(port);
  }
}
