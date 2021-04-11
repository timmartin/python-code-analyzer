import React, { useEffect, useState } from "react";
import Sk from "@timmartin2/skulpt";

interface Props {
  editable?: boolean;
  initialCode: string;
}

// Tokenize some Python code (using the tokenizer from the Skulpt library)
const tokenize = (code: string, setOutput: (data: object[]) => void): void => {
  const tokens = [] as object[];

  const lines = code.split("\n").map((l: string) => `${l}\n`);

  const readline = (): string => {
    if (lines.length === 0) {
      throw new Sk.builtin.Exception("EOF");
    }

    return lines.pop();
  };

  Sk._tokenize("<stdin>", readline, "utf-8", (tokenInfo) => {
    tokens.push({
      type: tokenInfo.type,
      token: tokenInfo.string,
      start: tokenInfo.start,
      end: tokenInfo.end,
      line: tokenInfo.line,
    });
  });

  setOutput(tokens);
};

// The tokenizer takes some Python code, runs it through the tokenizer and
// shows the output, to demonstrate how the tokenizer works.
const Tokenizer = ({
  initialCode,
  editable = true,
}: Props): React.ReactElement => {
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
      <textarea onChange={(e): void => setCode(e.target.value)} value={code} />
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
            onClick={(): void => tokenize(code, setOutput)}
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
