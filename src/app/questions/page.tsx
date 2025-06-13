'use client';

import { useState } from 'react';
import QuestionList from '@/components/QuestionList';
import { QuestionCategory } from '@/lib/questions';

const categories: QuestionCategory[] = ['Leadership', 'Delivery', 'Vendor Management'];

export default function QuestionsPage() {
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory>('Leadership');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Feedback Questions</h1>
      
      <div className="mb-8">
        <div className="flex space-x-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <QuestionList category={selectedCategory} />
    </div>
  );
} 