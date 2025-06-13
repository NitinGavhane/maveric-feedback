'use client';

import { useEffect, useState } from 'react';
import { getQuestionsByCategory, Question, QuestionCategory } from '@/lib/questions';

interface QuestionListProps {
  category: QuestionCategory;
}

export default function QuestionList({ category }: QuestionListProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuestions() {
      try {
        setLoading(true);
        const categoryQuestions = await getQuestionsByCategory(category);
        setQuestions(categoryQuestions);
        setError(null);
      } catch (err) {
        setError('Failed to load questions. Please try again later.');
        console.error('Error loading questions:', err);
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, [category]);

  if (loading) {
    return <div className="text-center py-4">Loading questions...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  if (questions.length === 0) {
    return <div className="text-center py-4">No questions available for this category.</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">{category} Questions</h2>
      <div className="grid gap-4">
        {questions.map((question) => (
          <div
            key={question.id}
            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <p className="text-gray-800">{question.text}</p>
            {question.coreValues && (
              <p className="text-sm text-gray-500 mt-2">
                Core Values: {question.coreValues}
              </p>
            )}
            {question.qualitySubsets && (
              <p className="text-sm text-gray-500">
                Quality Subsets: {question.qualitySubsets}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 