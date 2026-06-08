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

