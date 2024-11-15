import questions from "./questions.json";

interface Question {
  id: string;
  text: string;
  category: string;
}

export function getRandomQuestion(): Question {
  const { questions: questionList } = questions;
  const randomIndex = Math.floor(Math.random() * questionList.length);
  return questionList[randomIndex];
}

export function getQuestionsByCategory(category: string): Question[] {
  const { questions: questionList } = questions;
  return questionList.filter((q) => q.category === category);
}
