class Estrutura {
  #nome;
  constructor(nome) {
    this.#nome = nome;
  }
  get nome() {
    return this.#nome;
  }

  isEmpty() {
    throw new Error("Implementar na subclasse");
  }

  toString() {
    return `${this.#nome} (tamanho=${this.size})`;
  }
}

class Stack extends Estrutura {
  #items = [];

  constructor() {
    super("Stack");
  }

  push(item) {
    this.#items.push(item);
  }
  pop() {
    return this.#items.pop();
  }
  peek() {
    return this.#items.at(-1);
  }
  isEmpty() {
    return this.#items.length === 0;
  }
  get size() {
    return this.#items.length;
  }
  clear() {
    this.#items = [];
  }
  toArray() {
    return [...this.#items];
  }
}