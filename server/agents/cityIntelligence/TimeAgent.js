/**
 * TimeAgent - Time Block Calculator
 *
 * Calculates realistic time blocks for a city visit based on:
 * - Number of nights staying
 * - Arrival/departure times (if specified)
 * - Travel style and pace preferences
 *
 * This is a pure calculation agent - no external API calls needed.
 * It's the foundation for other agents (ClusterAgent depends on time blocks).
 *
 * Time Block Philosophy:
 * - 1 night = arrival afternoon (3-4h) + evening (3h) + next morning (2-3h)
 * - 2 nights = add full day in middle (morning + afternoon + evening)
 * - Each block has a "mood" suggesting what type of activity fits best
 */

const BaseAgent = require('./BaseAgent');

class TimeAgent extends BaseAgent {
  constructor() {
    super({
      name: 'TimeAgent',
      description: 'Calculate realistic time blocks for city visit',
      requiredInputs: ['city', 'nights'],
      optionalInputs: ['arrivalTime', 'departureTime', 'pace'],
      outputs: ['timeBlocks', 'totalUsableHours'],
      dependsOn: [],
      canRefine: false // Pure calculation, no refinement needed
    });

    // Default time assumptions
    this.defaults = {
      arrivalHour: 14,      // 2 PM arrival
      departureHour: 11,    // 11 AM departure
      morningStart: 9,
      morningEnd: 12,
      afternoonStart: 14,
      afternoonEnd: 18,
      eveningStart: 19,
      eveningEnd: 22
    };

    // Pace multipliers (affect hours per block)
    this.paceMultipliers = {
      relaxed: 0.8,    // Fewer hours, more downtime
      moderate: 1.0,   // Standard
      packed: 1.2      // More hours, maximize experiences
    };
  }

  /**
   * Main execution logic
   */
  async run(input, context) {
    const { city, nights, preferences } = input;
    const arrivalTime = input.arrivalTime || null;
    const departureTime = input.departureTime || null;
    const pace = preferences?.pace || 'moderate';

    this.reportProgress(10, 'Analyzing trip duration...');

    // Parse arrival/departure times
    const arrivalHour = arrivalTime
      ? this.parseTimeToHour(arrivalTime)
      : this.defaults.arrivalHour;

    const departureHour = departureTime
      ? this.parseTimeToHour(departureTime)
      : this.defaults.departureHour;

    this.reportProgress(30, 'Calculating time blocks...');

    // Generate time blocks
    const blocks = this.generateTimeBlocks(nights, arrivalHour, departureHour, pace);

    this.reportProgress(70, 'Optimizing block allocation...');

    // Calculate total usable hours
    const totalUsableHours = blocks.reduce((sum, block) => sum + block.hours, 0);

    // Add suggested activities based on mood and city context
    const enrichedBlocks = this.enrichBlocksWithSuggestions(blocks, city, preferences);

    this.reportProgress(100, 'Complete');

    return {
      data: {
        blocks: enrichedBlocks,
        totalUsableHours,
        summary: this.generateSummary(nights, totalUsableHours, pace)
      },
      confidence: 95, // High confidence for calculation-based output
      gaps: [],
      suggestions: []
    };
  }

  /**
   * Generate time blocks for the stay
   */
  generateTimeBlocks(nights, arrivalHour, departureHour, pace) {
    const blocks = [];
    const multiplier = this.paceMultipliers[pace] || 1.0;
    let blockId = 1;

    // Helper to create a block
    const createBlock = (dayNum, name, baseHours, mood, flexibility) => ({
      id: `block-${blockId++}`,
      dayNumber: dayNum,
      name,
      hours: Math.round(baseHours * multiplier * 10) / 10,
      mood,
      flexibility,
      suggested: null // Will be enriched later
    });

    // Day 1: Arrival day
    const arrivalAfternoonHours = Math.max(1, this.defaults.eveningStart - arrivalHour - 1);
    if (arrivalAfternoonHours >= 2) {
      blocks.push(createBlock(1, 'Arrival Afternoon', arrivalAfternoonHours, 'explore', 'high'));
    }
    blocks.push(createBlock(1, 'First Evening', 3, 'dine', 'medium'));

    // Middle days (full days)
    for (let day = 2; day <= nights; day++) {
      blocks.push(createBlock(day, `Day ${day} Morning`, 3, 'activity', 'medium'));
      blocks.push(createBlock(day, `Day ${day} Afternoon`, 4, 'explore', 'high'));
      blocks.push(createBlock(day, `Day ${day} Evening`, 3, 'dine', 'medium'));
    }

    // Final day: Departure
    const finalDay = nights + 1;
    const departureBlockHours = Math.max(1, departureHour - this.defaults.morningStart);
    if (departureBlockHours >= 1.5) {
      blocks.push(createBlock(finalDay, 'Departure Morning', departureBlockHours, 'depart', 'low'));
    }

    return blocks;
  }

  /**
   * Enrich blocks with activity suggestions based on mood and preferences
   */
  enrichBlocksWithSuggestions(blocks, city, preferences) {
    const suggestions = {
      explore: [
        'Wander the historic center',
        'Discover local neighborhoods',
        'Visit iconic landmarks',
        'Explore hidden streets and squares'
      ],
      dine: [
        'Experience local cuisine',
        'Try a recommended restaurant',
        'Evening aperitivo',
        'Traditional dinner spot'
      ],
      activity: [
        'Visit a museum or gallery',
        'Take a walking tour',
        'Morning market visit',
        'Cultural experience'
      ],
      depart: [
        'Final morning stroll',
        'Last coffee spot',
        'Pick up souvenirs',
        'Relaxed breakfast'
      ],
      arrive: [
        'Check in and freshen up',
        'Quick orientation walk',
        'First impressions tour'
      ]
    };

    // Add preference-based suggestions
    if (preferences?.interests) {
      const interests = preferences.interests;
      if (interests.includes('food') || interests.includes('culinary')) {
        suggestions.dine.unshift('Food tour or cooking class');
        suggestions.explore.push('Local food market exploration');
      }
      if (interests.includes('art') || interests.includes('culture')) {
        suggestions.activity.unshift('Major art museum visit');
      }
      if (interests.includes('nature') || interests.includes('outdoor')) {
        suggestions.explore.push('Parks and gardens walk');
        suggestions.activity.push('Scenic viewpoint hike');
      }
    }

    return blocks.map((block, index) => ({
      ...block,
      suggested: suggestions[block.mood]?.[index % suggestions[block.mood].length] ||
                 suggestions[block.mood]?.[0] ||
                 'Free time'
    }));
  }

  /**
   * Generate human-readable summary
   */
  generateSummary(nights, totalHours, pace) {
    const paceDescriptions = {
      relaxed: 'with plenty of downtime for spontaneous discoveries',
      moderate: 'balancing exploration with relaxation',
      packed: 'maximizing every moment of your visit'
    };

    return {
      text: `${nights} night${nights !== 1 ? 's' : ''} gives you approximately ${Math.round(totalHours)} usable hours, ${paceDescriptions[pace] || paceDescriptions.moderate}.`,
      nights,
      totalHours: Math.round(totalHours),
      pace
    };
  }

  /**
   * Parse time string to hour number
   * Accepts: "14:00", "2pm", "14", etc.
   */
  parseTimeToHour(timeStr) {
    if (typeof timeStr === 'number') return timeStr;

    const str = timeStr.toString().toLowerCase().trim();

    // Handle "2pm", "2 pm", "14:00", "14"
    const pmMatch = str.match(/(\d{1,2})\s*pm/);
    if (pmMatch) {
      const hour = parseInt(pmMatch[1]);
      return hour === 12 ? 12 : hour + 12;
    }

    const amMatch = str.match(/(\d{1,2})\s*am/);
    if (amMatch) {
      const hour = parseInt(amMatch[1]);
      return hour === 12 ? 0 : hour;
    }

    const colonMatch = str.match(/(\d{1,2}):/);
    if (colonMatch) {
      return parseInt(colonMatch[1]);
    }

    const numMatch = str.match(/(\d{1,2})/);
    if (numMatch) {
      return parseInt(numMatch[1]);
    }

    return this.defaults.arrivalHour;
  }
}

module.exports = TimeAgent;
