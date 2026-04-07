class Question {
  constructor({ id, category, prompt, choices, correctIndex, explanation }) {
    this.id = id
    this.category = category
    this.prompt = prompt
    this.choices = choices
    this.correctIndex = correctIndex
    this.explanation = explanation || null
  }

  toPublic() {
    return {
      id: this.id,
      category: this.category,
      prompt: this.prompt,
      choices: this.choices
    }
  }
}

module.exports = { Question }
