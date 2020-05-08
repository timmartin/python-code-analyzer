import React, { useState } from 'react';
import * as Sk from 'skulpt';

interface Props {
  initialCode: string;
}

// Tokenize some Python code (using the tokenizer from the Skulpt library)
const tokenize = (code: string, setOutput: (data: object[]) => void) => {
  const tokens = [] as object[];

  const tokenizer = new Sk.Tokenizer('<stdin>', false, (type, token, start, end, line) => {
    tokens.push({
      type: Sk.Tokenizer.tokenNames[type],
      token,
      start,
      end,
      line,
    });
  });

  const lines = code.split('\n').map((l: string) => (`${l}\n`));

  lines.forEach((line) => {
    tokenizer.generateTokens(line);
  });

  setOutput(tokens);
};

// The tokenizer takes some Python code, runs it through the tokenizer and
// shows the output, to demonstrate how the tokenizer works.
const Tokenizer = ({ initialCode }: Props) => {
  const [output, setOutput] = useState([]);

  return (
    <div className="python-analyzer-view tokenizer">
      <pre>
        {initialCode}
      </pre>
      <button
        type="button"
        onClick={() => tokenize(initialCode, setOutput)}
      >
        Tokenize code
      </button>
      <table>
        <tbody>
          {output.map((token) => (
            <tr>
              <td>{token.type}</td>
              <td>{token.token}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Tokenizer;
