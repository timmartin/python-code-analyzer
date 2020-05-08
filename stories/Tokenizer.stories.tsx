import React from "react";

import Tokenizer from "../src/Tokenizer";

export default {
  title: "Tokenizer",
  component: Tokenizer,
};

export const Default = () => <Tokenizer initialCode="print('a' + b)" />;

export const NotEditable = () => (
  <Tokenizer initialCode="print('a' + b)" editable={false} />
);
