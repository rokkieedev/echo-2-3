import { parseQuestionData, validateMCQResponse, validateNumericalResponse } from '../questionParser';

describe('Question Parser', () => {
  describe('parseQuestionData', () => {
    test('should parse MCQ question correctly', () => {
      const mcqData = {
        id: '1',
        question_type: 'MCQ' as const,
        question: 'What is 2+2?',
        options: ['2', '3', '4', '5'],
        correct_answer: '4',
        explanation: 'Basic addition'
      };

      const result = parseQuestionData(mcqData);

      expect(result).toEqual({
        id: '1',
        type: 'MCQ',
        stem: 'What is 2+2?',
        options: ['2', '3', '4', '5'],
        correctAnswer: '4',
        explanation: 'Basic addition'
      });
    });

    test('should parse numerical question correctly', () => {
      const numData = {
        id: '2',
        question_type: 'NUM' as const,
        question: 'Calculate the value of π to 2 decimal places',
        correct_answer: '3.14',
        explanation: 'π ≈ 3.14159...'
      };

      const result = parseQuestionData(numData);

      expect(result).toEqual({
        id: '2',
        type: 'NUM',
        stem: 'Calculate the value of π to 2 decimal places',
        correctAnswer: '3.14',
        explanation: 'π ≈ 3.14159...'
      });
    });

    test('should handle missing optional fields', () => {
      const minimalData = {
        id: '3',
        question_type: 'MCQ' as const,
        question: 'Test question',
        options: ['A', 'B'],
        correct_answer: 'A'
      };

      const result = parseQuestionData(minimalData);

      expect(result).toEqual({
        id: '3',
        type: 'MCQ',
        stem: 'Test question',
        options: ['A', 'B'],
        correctAnswer: 'A',
        explanation: undefined
      });
    });
  });

  describe('validateMCQResponse', () => {
    test('should validate correct MCQ response', () => {
      const result = validateMCQResponse('B', 'B');
      expect(result).toEqual({
        isCorrect: true,
        userAnswer: 'B',
        correctAnswer: 'B'
      });
    });

    test('should validate incorrect MCQ response', () => {
      const result = validateMCQResponse('A', 'B');
      expect(result).toEqual({
        isCorrect: false,
        userAnswer: 'A',
        correctAnswer: 'B'
      });
    });

    test('should handle empty response', () => {
      const result = validateMCQResponse('', 'B');
      expect(result).toEqual({
        isCorrect: false,
        userAnswer: '',
        correctAnswer: 'B'
      });
    });
  });

  describe('validateNumericalResponse', () => {
    test('should validate exact numerical match', () => {
      const result = validateNumericalResponse('3.14', '3.14');
      expect(result).toEqual({
        isCorrect: true,
        userAnswer: '3.14',
        correctAnswer: '3.14'
      });
    });

    test('should validate with tolerance', () => {
      const result = validateNumericalResponse('3.141', '3.14', 0.01);
      expect(result).toEqual({
        isCorrect: true,
        userAnswer: '3.141',
        correctAnswer: '3.14'
      });
    });

    test('should reject answer outside tolerance', () => {
      const result = validateNumericalResponse('3.2', '3.14', 0.01);
      expect(result).toEqual({
        isCorrect: false,
        userAnswer: '3.2',
        correctAnswer: '3.14'
      });
    });

    test('should handle invalid numerical input', () => {
      const result = validateNumericalResponse('abc', '3.14');
      expect(result).toEqual({
        isCorrect: false,
        userAnswer: 'abc',
        correctAnswer: '3.14'
      });
    });

    test('should handle integer responses', () => {
      const result = validateNumericalResponse('5', '5');
      expect(result).toEqual({
        isCorrect: true,
        userAnswer: '5',
        correctAnswer: '5'
      });
    });
  });
});