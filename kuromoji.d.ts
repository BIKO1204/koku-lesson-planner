declare module "kuromoji" {
  interface Token {
    pos: string;
    basic_form: string;
    surface_form: string;
    // 必要に応じて他のプロパティも追加してください
  }

  interface Tokenizer {
    tokenize(text: string): Token[];
  }

  interface Builder {
    build(callback: (err: Error | null, tokenizer: Tokenizer) => void): void;
  }

  export function builder(dictPath: string): Builder;
}
