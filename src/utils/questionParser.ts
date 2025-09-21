interface RawQuestionData {
  id: string;
  question_type: 'MCQ' | 'NUM';
  question: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
  image_url?: string;
}

interface ParsedQuestion {
  id: string;
  type: 'MCQ' | 'NUM';
  stem: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  imageUrl?: string;
}

interface ValidationResult {
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
}

export const parseQuestionData = (rawData: RawQuestionData): ParsedQuestion => {
  return {
    id: rawData.id,
    type: rawData.question_type,
    stem: rawData.question,
    options: rawData.options,
    correctAnswer: rawData.correct_answer,
    explanation: rawData.explanation,
    imageUrl: rawData.image_url,
  };
};

export const validateMCQResponse = (
  userResponse: string,
  correctAnswer: string
): ValidationResult => {
  return {
    isCorrect: userResponse === correctAnswer,
    userAnswer: userResponse,
    correctAnswer: correctAnswer,
  };
};

export const validateNumericalResponse = (
  userResponse: string,
  correctAnswer: string,
  tolerance: number = 0
): ValidationResult => {
  const userNum = parseFloat(userResponse);
  const correctNum = parseFloat(correctAnswer);
  
  // Check if parsing was successful
  if (isNaN(userNum) || isNaN(correctNum)) {
    return {
      isCorrect: false,
      userAnswer: userResponse,
      correctAnswer: correctAnswer,
    };
  }
  
  // Check if within tolerance
  const isCorrect = Math.abs(userNum - correctNum) <= tolerance;
  
  return {
    isCorrect,
    userAnswer: userResponse,
    correctAnswer: correctAnswer,
  };
};

export const calculateScore = (
  responses: ValidationResult[],
  markingScheme: { mcqCorrect: number; mcqIncorrect: number; numCorrect: number; numIncorrect: number }
): number => {
  return responses.reduce((total, response, index) => {
    if (response.isCorrect) {
      // Assuming MCQ for now - would need question type info
      return total + markingScheme.mcqCorrect;
    } else if (response.userAnswer !== '') {
      // Attempted but incorrect
      return total + markingScheme.mcqIncorrect;
    }
    // Not attempted - no points
    return total;
  }, 0);
};