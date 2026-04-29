/**
 * Suggestion Feedback Service
 * Track user feedback on AI suggestions
 */

import db from './database';

class SuggestionFeedbackService {
  constructor() {
    this.feedbackCache = new Map();
  }

  /**
   * Record suggestion acceptance
   * @param {string} suggestionId - Suggestion ID
   * @param {string} action - Action taken (accept, dismiss, modify, save)
   * @param {Object} details - Additional details
   * @returns {Promise<Object>} Feedback record
   */
  async recordAcceptance(suggestionId, action, details = {}) {
    try {
      const feedback = {
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        suggestionId,
        action, // 'accept' | 'dismiss' | 'modify' | 'save'
        rating: details.rating || null,
        comment: details.comment || '',
        timestamp: Date.now(),
        suggestionType: details.suggestionType || null,
        priority: details.priority || null
      };

      try {
        await db.add('suggestionFeedback', feedback);
      } catch (e) {
        // Table might not exist
        await db.add('suggestionFeedback', feedback);
      }

      return feedback;
    } catch (error) {
      console.error('Error recording suggestion acceptance:', error);
      throw error;
    }
  }

  /**
   * Rate a suggestion
   * @param {string} suggestionId - Suggestion ID
   * @param {number} rating - Rating 1-5
   * @param {string} comment - Optional comment
   * @returns {Promise<Object>} Feedback record
   */
  async rateSuggestion(suggestionId, rating, comment = '') {
    try {
      const feedback = {
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        suggestionId,
        action: 'rated',
        rating: Math.max(1, Math.min(5, rating)),
        comment,
        timestamp: Date.now()
      };

      try {
        await db.add('suggestionFeedback', feedback);
      } catch (e) {
        await db.add('suggestionFeedback', feedback);
      }

      return feedback;
    } catch (error) {
      console.error('Error rating suggestion:', error);
      throw error;
    }
  }

  /**
   * Get feedback for a suggestion
   * @param {string} suggestionId - Suggestion ID
   * @returns {Promise<Array>} Feedback records
   */
  async getFeedbackForSuggestion(suggestionId) {
    try {
      let feedback = [];
      try {
        feedback = await db.getAll('suggestionFeedback') || [];
      } catch (e) {
        return [];
      }

      return feedback.filter(f => f.suggestionId === suggestionId);
    } catch (error) {
      console.error('Error getting feedback for suggestion:', error);
      return [];
    }
  }

  /**
   * Analyze feedback patterns
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Feedback analysis
   */
  async analyzeFeedbackPatterns(filters = {}) {
    try {
      let feedback = [];
      try {
        feedback = await db.getAll('suggestionFeedback') || [];
      } catch (e) {
        return {
          acceptanceRate: 0,
          averageRating: 0,
          byType: {},
          byPriority: {},
          patterns: []
        };
      }

      // Apply filters
      if (filters.suggestionType) {
        feedback = feedback.filter(f => f.suggestionType === filters.suggestionType);
      }
      if (filters.dateRange) {
        const start = filters.dateRange.start || 0;
        const end = filters.dateRange.end || Date.now();
        feedback = feedback.filter(f => f.timestamp >= start && f.timestamp <= end);
      }

      const accepted = feedback.filter(f => f.action === 'accept').length;
      const dismissed = feedback.filter(f => f.action === 'dismiss').length;
      const rated = feedback.filter(f => f.rating !== null);
      
      const acceptanceRate = feedback.length > 0 ? accepted / feedback.length : 0;
      const averageRating = rated.length > 0 
        ? rated.reduce((sum, f) => sum + (f.rating || 0), 0) / rated.length 
        : 0;

      // Group by type
      const byType = {};
      feedback.forEach(f => {
        const type = f.suggestionType || 'unknown';
        if (!byType[type]) {
          byType[type] = { accepted: 0, dismissed: 0, total: 0, averageRating: 0 };
        }
        byType[type].total++;
        if (f.action === 'accept') byType[type].accepted++;
        if (f.action === 'dismiss') byType[type].dismissed++;
        if (f.rating) {
          byType[type].averageRating = (byType[type].averageRating * (byType[type].total - 1) + f.rating) / byType[type].total;
        }
      });

      // Group by priority
      const byPriority = {};
      feedback.forEach(f => {
        const priority = f.priority || 'unknown';
        if (!byPriority[priority]) {
          byPriority[priority] = { accepted: 0, dismissed: 0, total: 0 };
        }
        byPriority[priority].total++;
        if (f.action === 'accept') byPriority[priority].accepted++;
        if (f.action === 'dismiss') byPriority[priority].dismissed++;
      });

      // Identify patterns
      const patterns = [];
      
      // High acceptance rate types
      Object.entries(byType).forEach(([type, data]) => {
        if (data.total >= 5 && data.accepted / data.total > 0.7) {
          patterns.push({
            type: 'high_acceptance',
            category: type,
            message: `${type} suggestions have ${Math.round((data.accepted / data.total) * 100)}% acceptance rate`
          });
        }
      });

      // Low acceptance rate types
      Object.entries(byType).forEach(([type, data]) => {
        if (data.total >= 5 && data.accepted / data.total < 0.3) {
          patterns.push({
            type: 'low_acceptance',
            category: type,
            message: `${type} suggestions have ${Math.round((data.accepted / data.total) * 100)}% acceptance rate - may need improvement`
          });
        }
      });

      return {
        acceptanceRate,
        averageRating,
        byType,
        byPriority,
        patterns,
        totalFeedback: feedback.length
      };
    } catch (error) {
      console.error('Error analyzing feedback patterns:', error);
      return {
        acceptanceRate: 0,
        averageRating: 0,
        byType: {},
        byPriority: {},
        patterns: []
      };
    }
  }

  /**
   * Get feedback statistics
   * @returns {Promise<Object>} Feedback statistics
   */
  async getFeedbackStats() {
    try {
      let feedback = [];
      try {
        feedback = await db.getAll('suggestionFeedback') || [];
      } catch (e) {
        return {
          total: 0,
          accepted: 0,
          dismissed: 0,
          rated: 0,
          averageRating: 0
        };
      }

      return {
        total: feedback.length,
        accepted: feedback.filter(f => f.action === 'accept').length,
        dismissed: feedback.filter(f => f.action === 'dismiss').length,
        rated: feedback.filter(f => f.rating !== null).length,
        averageRating: feedback.filter(f => f.rating).length > 0
          ? feedback.filter(f => f.rating).reduce((sum, f) => sum + f.rating, 0) / feedback.filter(f => f.rating).length
          : 0
      };
    } catch (error) {
      console.error('Error getting feedback stats:', error);
      return {
        total: 0,
        accepted: 0,
        dismissed: 0,
        rated: 0,
        averageRating: 0
      };
    }
  }
}

// Create singleton instance
const suggestionFeedbackService = new SuggestionFeedbackService();

export default suggestionFeedbackService;
