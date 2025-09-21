import { supabase } from '@/integrations/supabase/client';

interface PercentileData {
  score: number;
  percentile: number;
}

export class PercentileCalculator {
  private static percentileCache: Map<string, PercentileData[]> = new Map();

  static async getPercentileData(examType: 'mains' | 'advanced'): Promise<PercentileData[]> {
    if (this.percentileCache.has(examType)) {
      return this.percentileCache.get(examType)!;
    }

    const { data, error } = await supabase
      .from('jee_percentiles')
      .select('score, percentile')
      .eq('exam_type', examType)
      .order('score');

    if (error) {
      console.error('Error fetching percentile data:', error);
      return [];
    }

    this.percentileCache.set(examType, data);
    return data;
  }

  static async calculatePercentile(score: number, examType: 'mains' | 'advanced'): Promise<number> {
    const percentileData = await this.getPercentileData(examType);

    if (percentileData.length === 0) {
      return 0;
    }

    // If exact score exists in data
    const exactMatch = percentileData.find(d => d.score === score);
    if (exactMatch) {
      return Math.min(100, Math.max(0.1, exactMatch.percentile));
    }

    // Find the two closest scores for interpolation
    let lowerBound: PercentileData | null = null;
    let upperBound: PercentileData | null = null;

    for (const data of percentileData) {
      if (data.score <= score) {
        lowerBound = data;
      } else if (data.score > score && !upperBound) {
        upperBound = data;
        break;
      }
    }

    const minPercentile = Math.min(...percentileData.map(d => d.percentile));
    const maxPercentile = Math.max(...percentileData.map(d => d.percentile));

    // Handle edge cases
    if (!lowerBound) {
      // Score below minimum in dataset: return very low percentile
      return Math.max(0.1, Math.min(1, minPercentile));
    }
    if (!upperBound) {
      // Score above maximum in dataset: treat as full marks
      return 100;
    }

    // Linear interpolation
    const scoreDiff = upperBound.score - lowerBound.score;
    const percentileDiff = upperBound.percentile - lowerBound.percentile;
    const scoreOffset = score - lowerBound.score;

    const interpolatedPercentile = lowerBound.percentile + (percentileDiff * scoreOffset / scoreDiff);

    // Clamp to [0.1, 100]
    const clamped = Math.min(100, Math.max(0.1, interpolatedPercentile));
    return Math.round(clamped * 100) / 100; // Round to 2 decimal places
  }

  static calculatePredictedRank(percentile: number, examType: 'mains' | 'advanced'): number {
    // JEE Mains: ~12 lakh candidates, JEE Advanced: ~2.5 lakh candidates
    const totalCandidates = examType === 'mains' ? 1200000 : 250000;
    // Ensure AIR = 1 at 100 percentile, and close to max rank at very low percentile
    const rank = Math.round(totalCandidates * (100 - percentile) / 100);
    return Math.max(1, rank);
  }

  static getPerformanceCategory(percentile: number): {
    category: string;
    color: string;
    description: string;
  } {
    if (percentile >= 99) {
      return {
        category: 'Exceptional',
        color: 'text-green-600',
        description: 'Top 1% performance - Excellent chances for top NITs/IITs'
      };
    } else if (percentile >= 95) {
      return {
        category: 'Excellent',
        color: 'text-blue-600',
        description: 'Top 5% performance - Good chances for NITs/IITs'
      };
    } else if (percentile >= 85) {
      return {
        category: 'Very Good',
        color: 'text-indigo-600',
        description: 'Top 15% performance - Eligible for good engineering colleges'
      };
    } else if (percentile >= 70) {
      return {
        category: 'Good',
        color: 'text-purple-600',
        description: 'Top 30% performance - Eligible for many engineering colleges'
      };
    } else if (percentile >= 50) {
      return {
        category: 'Average',
        color: 'text-orange-600',
        description: 'Above average performance - Keep improving'
      };
    } else {
      return {
        category: 'Needs Improvement',
        color: 'text-red-600',
        description: 'Focus on weak areas and practice more'
      };
    }
  }
}
