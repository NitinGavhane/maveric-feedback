import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';

export type QuestionCategory = 'Leadership' | 'Delivery' | 'Vendor Management';

export interface Question {
  id?: string;
  text: string;
  category: QuestionCategory;
  createdAt: Timestamp;
  coreValues?: string;
  qualitySubsets?: string;
}

// Function to store generated questions in Firebase
export async function storeQuestions(questions: string[], category: QuestionCategory, coreValues: string, qualitySubsets: string) {
  const questionsCollection = collection(db, 'questions');
  const timestamp = Timestamp.now();
  
  const questionPromises = questions.map(async (questionText) => {
    const questionData: Omit<Question, 'id'> = {
      text: questionText,
      category,
      createdAt: timestamp,
      coreValues,
      qualitySubsets
    };
    
    return addDoc(questionsCollection, questionData);
  });

  try {
    await Promise.all(questionPromises);
    return true;
  } catch (error) {
    console.error('Error storing questions:', error);
    throw error;
  }
}

// Function to retrieve questions by category
export async function getQuestionsByCategory(category: QuestionCategory): Promise<Question[]> {
  const questionsCollection = collection(db, 'questions');
  const q = query(questionsCollection, where('category', '==', category));
  
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Question));
  } catch (error) {
    console.error('Error retrieving questions:', error);
    throw error;
  }
}

// Function to get all questions
export async function getAllQuestions(): Promise<Question[]> {
  const questionsCollection = collection(db, 'questions');
  
  try {
    const querySnapshot = await getDocs(questionsCollection);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Question));
  } catch (error) {
    console.error('Error retrieving all questions:', error);
    throw error;
  }
} 