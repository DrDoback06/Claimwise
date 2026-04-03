/**
 * Suggestion Learning Service
 * Learn from user feedback to improve future suggestions
 */

import db from './database';
import suggestionFeedbackService from './suggestionFeedbackService';

class SuggestionLearningService {
  constructor() {
    this.preferences = new Map();
    this.learnedPatterns = new Map();
  }

  /**
   * Learn from feedback patterns
   * @returns {Promise<Object>} Learned preferences
   */
  async learnFromFeedback() {
    try {
      const analysis = await suggestionFeedbackService.analyzeFeedbackPatterns();
      
      // Extract preferences
      const preferences = {
        preferredTypes: [],
        avoidedTypes: [],
        preferredPriorities: [],
        ratingThreshold: 3.5
      };

      // Identify preferred types (high acceptance + high rating)
      Object.entries(analysis.byType).forEach(([type, data]) => {
        if (data.total >= 3) {
          const acceptanceRate = data.accepted / data.total;
          if (acceptanceRate > 0.7 && data.averageRating > 3.5) {
            preferences.preferredTypes.push({
              type,
              acceptanceRate,
              averageRating: data.averageRating
            });
          } else if (acceptanceRate < 0.3) {
            preferences.avoidedTypes.push({
              type,
              acceptanceRate,
              averageRating: data.averageRating
            });
          }
        }
      });

      // Identify preferred priorities
      Object.entries(analysis.byPriority).forEach(([priority, data]) => {
        if (data.total >= 3) {
          const acceptanceRate = data.accepted / data.total;
          if (acceptanceRate > 0.7) {
            preferences.preferredPriorities.push({
              priority,
              acceptanceRate
            });
          }
        }
      });

      // Store preferences
      this.preferences.set('user', preferences);
      
      // Store learned patterns
      this.learnedPatterns.set('feedback', analysis.patterns);

      return preferences;
    } catch (error) {
      console.error('Error learning from feedback:', error);
      return {
        preferredTypes: [],
        avoidedTypes: [],
        preferredPriorities: [],
        ratingThreshold: 3.5
      };
    }
  }

  /**
   * Recognize patterns in accepted suggestions
   * @returns {Promise<Array>} Recognized patterns
   */
  async recognizePatterns() {
    try {
      let feedback = [];
      try {
        feedback = await db.getAll('suggestionFeedback') || [];
      } catch (e) {
        return [];
      }

      const accepted = feedback.filter(f => f.action === 'accept');
      const patterns = [];

      // Pattern: High-rated suggestion types
      const typeRatings = {};
      accepted.forEach(f => {
        if (f.suggestionType && f.rating) {
          if (!typeRatings[f.suggestionType]) {
            typeRatings[f.suggestionType] = [];
          }
          typeRatings[f.suggestionType].push(f.rating);
        }
      });

      Object.entries(typeRatings).forEach(([type, ratings]) => {
        if (ratings.length >= 3) {
          const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
          if (avgRating >= 4.0) {
            patterns.push({
              type: 'high_rated_type',
              category: type,
              averageRating: avgRating,
              message: `${type} suggestions average ${avgRating.toFixed(1)}/5 rating`
            });
          }
        }
      });

      // Pattern: Priority preferences
      const priorityAcceptance = {};
      accepted.forEach(f => {
        if (f.priority) {
          if (!priorityAcceptance[f.priority]) {
            priorityAcceptance[f.priority] = { accepted: 0, total: 0 };
          }
          priorityAcceptance[f.priority].accepted++;
        }
      });

      const allFeedback = await db.getAll('suggestionFeedback') || [];
      allFeedback.forEach(f => {
        if (f.priority) {
          if (!priorityAcceptance[f.priority]) {
            priorityAcceptance[f.priority] = { accepted: 0, total: 0 };
          }
          priorityAcceptance[f.priority].total++;
        }
      });

      Object.entries(priorityAcceptance).forEach(([priority, data]) => {
        if (data.total >= 5) {
          const rate = data.accepted / data.total;
          if (rate > 0.8) {
            patterns.push({
              type: 'preferred_priority',
              category: priority,
              acceptanceRate: rate,
              message: `${priority} priority suggestions have ${Math.round(rate * 100)}% acceptance`
            });
          }
        }
      });

      return patterns;
    } catch (error) {
      console.error('Error recognizing patterns:', error);
      return [];
    }
  }

  /**
   * Adjust AI confidence based on feedback
   * @param {string} suggestionType - Suggestion type
   * @param {string} priority - Suggestion priority
   * @param {number} baseConfidence - Base confidence score
   * @returns {Promise<number>} Adjusted confidence
   */
  async adjustConfidence(suggestionType, priority, baseConfidence) {
    try {
      const preferences = await this.learnFromFeedback();
      
      let adjustedConfidence = baseConfidence;

      // Adjust based on preferred types
      const preferredType = preferences.preferredTypes.find(pt => pt.type === suggestionType);
      if (preferredType) {
        adjustedConfidence += 0.1; // Boost confidence for preferred types
      }

      // Adjust based on avoided types
      const avoidedType = preferences.avoidedTypes.find(at => at.type === suggestionType);
      if (avoidedType) {
        adjustedConfidence -= 0.1; // Reduce confidence for avoided types
      }

      // Adjust based on preferred priorities
      const preferredPriority = preferences.preferredPriorities.find(pp => pp.priority === priority);
      if (preferredPriority) {
        adjustedConfidence += 0.05; // Slight boost for preferred priorities
      }

      // Clamp between 0 and 1
      return Math.max(0, Math.min(1, adjustedConfidence));
    } catch (error) {
      console.error('Error adjusting confidence:', error);
      return baseConfidence;
    }
  }

  /**
   * Personalize suggestions to user style
   * @param {Array} suggestions - Suggestions to personalize
   * @returns {Promise<Array>} Personalized suggestions
   */
  async personalizeSuggestions(suggestions) {
    try {
      const preferences = await this.learnFromFeedback();
      const patterns = await this.recognizePatterns();

      return suggestions.map(suggestion => {
        const personalized = { ...suggestion };

        // Boost priority for preferred types
        const preferredType = preferences.preferredTypes.find(pt => pt.type === suggestion.type);
        if (preferredType) {
          if (personalized.priority === 'medium') {
            personalized.priority = 'high';
          } else if (personalized.priority === 'low') {
            personalized.priority = 'medium';
          }
        }

        // Adjust confidence
        if (personalized.confidence !== undefined) {
          personalized.confidence = this.adjustConfidence(
            suggestion.type,
            suggestion.priority || 'medium',
            personalized.confidence
          );
        }

        // Add personalization note
        if (preferredType) {
          personalized.personalized = true;
          personalized.personalizationNote = `Based on your preferences, this ${suggestion.type} suggestion is likely to be useful`;
        }

        return personalized;
      });
    } catch (error) {
      console.error('Error personalizing suggestions:', error);
      return suggestions;
    }
  }

  /**
   * Get user preferences
   * @returns {Promise<Object>} User preferences
   */
  async getUserPreferences() {
    try {
      await this.learnFromFeedback();
      return this.preferences.get('user') || {
        preferredTypes: [],
        avoidedTypes: [],
        preferredPriorities: [],
        ratingThreshold: 3.5
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return {
        preferredTypes: [],
        avoidedTypes: [],
        preferredPriorities: [],
        ratingThreshold: 3.5
      };
    }
  }

  /**
   * Get learned patterns
   * @returns {Promise<Array>} Learned patterns
   */
  async getLearnedPatterns() {
    try {
      const patterns = await this.recognizePatterns();
      const feedbackPatterns = this.learnedPatterns.get('feedback') || [];
      return [...patterns, ...feedbackPatterns];
    } catch (error) {
      console.error('Error getting learned patterns:', error);
      return [];
    }
  }
}

// Create singleton instance
const suggestionLearningService = new SuggestionLearningService();

export default suggestionLearningService;
