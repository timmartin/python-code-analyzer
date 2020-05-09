import React, { useEffect, useState } from "react";
import * as Sk from "skulpt";

interface Props {
  editable?: boolean;
  initialCode: string;
}

// Tokenize some Python code (using the tokenizer from the Skulpt library)
const tokenize = (code: string, setOutput: (data: object[]) => void) => {
  const tokens = [] as object[];

  const tokenizer = new Sk.Tokenizer(
    "<stdin>",
    false,
    (type, token, start, end, line) => {
      tokens.push({
        type: Sk.Tokenizer.tokenNames[type],
        token,
        start,
        end,
        line,
      });
    }
  );

  const lines = code.split("\n").map((l: string) => `${l}\n`);

  lines.forEach((line) => {
    tokenizer.generateTokens(line);
  });

  setOutput(tokens);
};

// The tokenizer takes some Python code, runs it through the tokenizer and
// shows the output, to demonstrate how the tokenizer works.
const Tokenizer = ({ initialCode, editable = true }: Props) => {
  const [output, setOutput] = useState([]);
  const [code, setCode] = useState(initialCode);

  // If the tokenizer input is not editable, we just tokenize it and show the
  // output immediately, there's no reason to wait for the user to press the
  // button. We do this in an effect because it's possible that the tokenize
  // will take a long time and we don't want to block rendering. Also, it makes
  // the code below more consistent.
  useEffect(() => {
    if (!editable) {
      tokenize(code, setOutput);
    }
  }, [initialCode, editable]);

  let codeView: React.ReactElement;
  if (editable) {
    codeView = (
      <textarea onChange={(e) => setCode(e.target.value)} value={code} />
    );
  } else {
    codeView = <pre>{initialCode}</pre>;
  }

  return (
    <div className="python-analyzer-view tokenizer">
      <div className="editor">
        {codeView}

        {editable && (
          <button
            type="button"
            className="execute"
            onClick={() => tokenize(code, setOutput)}
          >
            Tokenize code
          </button>
        )}
      </div>

      <div className="output">
        <table className="output">
          <tbody>
            {output.map((token, index) => (
              <tr key={index}>
                <td>{token.type}</td>
                <td>{token.token}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Tokenizer;
