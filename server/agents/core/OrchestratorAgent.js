/**
 * OrchestratorAgent v2 - The Conductor of Agentic Coordination
 *
 * This agent coordinates the complete Discovery → Validation → Selection pipeline
 * with feedback loops. It's the "brain" that makes the system truly agentic.
 *
 * Flow:
 * 1. Discovery:  StrategicDiscoveryAgent finds 3-5 candidates
 * 2. Validation: ValidationOrchestrator validates all candidates
 * 3. Selection:  Score & rank valid candidates, select best
 * 4. Feedback:   If no valid candidates, analyze failures and retry
 *
 * Key Innovation: FEEDBACK LOOPS
 * - Validation fails → Analyze WHY → Update strategy → Discover again
 * - This creates a true agentic system that learns and adapts
 */

const StrategicDiscoveryAgent = require('../discovery/StrategicDiscoveryAgent');
const ValidationOrchestrator = require('../validation/ValidationOrchestrator');

class OrchestratorAgent {
  constructor(sharedContext, db, googleApiKey) {
    this.context = sharedContext;
    this.db = db;

    console.log(`🔑 OrchestratorAgent: Received API Key = ${googleApiKey ? googleApiKey.substring(0, 10) + '...' : 'UNDEFINED'}`);

    // Initialize sub-agents
    this.discoveryAgent = new StrategicDiscoveryAgent(sharedContext);

    // Validation orchestrator (if Google API key available)
    this.validationOrchestrator = googleApiKey
      ? new ValidationOrchestrator(db, googleApiKey)
      : null;

    if (!this.validationOrchestrator) {
      console.warn('⚠️  OrchestratorAgent: No Google API key - validation disabled');
    } else {
      console.log('✓ OrchestratorAgent: ValidationOrchestrator initialized');
    }
  }

  /**
   * Main coordination loop for discovering and selecting ONE activity
   * This is where the agentic magic happens!
   */
  async discoverAndSelectActivity(request, maxAttempts = 3) {
    console.log(`\n🎬 OrchestratorAgent: Starting discovery for ${request.purpose || 'activity'}`);
    console.log(`   Time: ${request.timeWindow.start} - ${request.timeWindow.end}`);
    console.log(`   Max attempts: ${maxAttempts}`);

    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt++;

      console.log(`\n📍 === ATTEMPT ${attempt}/${maxAttempts} ===`);

      try {
        // PHASE 1: STRATEGIC DISCOVERY
        console.log(`\n1️⃣  DISCOVERY PHASE`);

        const discoveryResult = await this.discoveryAgent.discoverCandidates(request);

        console.log(`   ✓ Discovered ${discoveryResult.candidates.length} candidates`);
        console.log(`   Strategy: ${discoveryResult.reasoning}`);

        if (discoveryResult.candidates.length === 0) {
          console.warn(`   ⚠️  No candidates discovered - skipping validation`);

          this.context.recordDecision({
            phase: 'discovery_failed',
            attempt: attempt,
            reason: 'No candidates discovered',
            request: request
          });

          if (attempt < maxAttempts) {
            continue; // Try again
          } else {
            return this.buildFailureResponse(maxAttempts, 'No candidates could be discovered');
          }
        }

        // PHASE 2: VALIDATION
        console.log(`\n2️⃣  VALIDATION PHASE`);

        const validationResults = await this.validateCandidates(
          discoveryResult.candidates,
          request
        );

        const validCandidates = validationResults.filter(r => r.valid);
        const invalidCandidates = validationResults.filter(r => !r.valid);

        console.log(`   ✓ Valid: ${validCandidates.length}/${discoveryResult.candidates.length}`);

        if (invalidCandidates.length > 0) {
          console.log(`   ❌ Invalid: ${invalidCandidates.length}`);
          invalidCandidates.forEach(inv => {
            console.log(`      - ${inv.candidate.name}: ${inv.status || inv.reason}`);
          });
        }

        // Log validation results
        this.context.recordDecision({
          phase: 'validation',
          attempt: attempt,
          totalCandidates: discoveryResult.candidates.length,
          validCandidates: validCandidates.length,
          invalidCandidates: invalidCandidates.length,
          validationResults: validationResults.map(r => ({
            name: r.candidate.name,
            valid: r.valid,
            confidence: r.confidence,
            status: r.status
          }))
        });

        // PHASE 3: SELECTION
        if (validCandidates.length > 0) {
          console.log(`\n3️⃣  SELECTION PHASE`);

          const selected = await this.selectBestCandidate(validCandidates, request);

          console.log(`   ✓ Selected: ${selected.place.name}`);
          console.log(`   Score: ${selected.score.toFixed(1)}/100`);
          console.log(`   Reasoning: ${selected.reasoning}`);

          // Log selection decision with alternatives
          this.context.recordDecision({
            phase: 'selection',
            attempt: attempt,
            selected: {
              name: selected.place.name,
              score: selected.score,
              confidence: selected.confidence,
              reasoning: selected.reasoning
            },
            validCandidates: validCandidates.length,
            totalCandidates: discoveryResult.candidates.length,
            alternatives: validCandidates
              .filter(c => c.place.name !== selected.place.name)
              .map(c => ({
                name: c.place.name,
                score: c.score,
                whyNotSelected: c.rejectionReason || `Lower score (${c.score} vs ${selected.score})`
              }))
          });

          // Update shared context
          this.context.addValidatedPlace(selected.place);
          if (selected.place.estimatedCost) {
            this.context.updateBudget(selected.place.estimatedCost);
          }
          if (selected.place.coordinates) {
            this.context.updateLastLocation(selected.place.coordinates);
          }
          if (selected.place.type) {
            this.context.trackActivityType(selected.place.type);
          }
          if (selected.place.energyLevel) {
            this.context.trackEnergyLevel(selected.place.energyLevel);
          }

          this.context.incrementActivityCount();

          return {
            success: true,
            activity: selected.place,
            reasoning: selected.reasoning,
            confidence: selected.confidence,
            score: selected.score,
            attempts: attempt,
            alternatives: validCandidates.length - 1
          };
        }

        // PHASE 4: FEEDBACK LOOP
        console.log(`\n4️⃣  FEEDBACK PHASE (no valid candidates)`);

        if (attempt >= maxAttempts) {
          console.error(`   ❌ Max attempts reached - giving up`);
          break;
        }

        const failureAnalysis = this.analyzeValidationFailures(
          discoveryResult.candidates,
          validationResults
        );

        console.log(`   📊 Failure analysis: ${failureAnalysis.feedback}`);

        // Learn from failures
        for (const failure of failureAnalysis.failures) {
          this.context.markPlaceInvalid(failure.name, failure.reason);
        }

        // Update request with feedback
        request = this.updateRequestWithFeedback(request, failureAnalysis);

        console.log(`   🔄 Updating strategy and retrying...`);

        // Log feedback
        this.context.recordDecision({
          phase: 'feedback',
          attempt: attempt,
          failureAnalysis: failureAnalysis,
          updatedConstraints: request.updatedConstraints || [],
          nextAction: 'retry_with_updated_strategy'
        });

        // Loop continues with updated request...

      } catch (error) {
        console.error(`   ❌ Attempt ${attempt} error:`, error.message);

        this.context.recordDecision({
          phase: 'error',
          attempt: attempt,
          error: error.message,
          stack: error.stack
        });

        if (attempt >= maxAttempts) {
          throw error;
        }

        // Try again
        console.log(`   🔄 Retrying after error...`);
      }
    }

    // Max attempts exhausted
    return this.buildFailureResponse(maxAttempts, 'No valid candidates found after all attempts');
  }

  /**
   * Validate all discovered candidates
   */
  async validateCandidates(candidates, request) {
    if (!this.validationOrchestrator) {
      // No validation available - mark all as valid
      console.log(`   ⚠️  Validation skipped (no Google API key)`);

      return candidates.map(candidate => ({
        valid: true,
        candidate: candidate,
        place: candidate,
        confidence: 0.5,
        status: 'unvalidated'
      }));
    }

    const validationResults = [];

    // Validate each candidate
    for (const candidate of candidates) {
      try {
        const result = await this.validationOrchestrator.placesValidator.validatePlace(
          {
            name: candidate.name,
            address: candidate.address,
            type: candidate.type,
            estimatedCost: candidate.estimatedCost,
            estimatedDuration: candidate.estimatedDuration,
            energyLevel: candidate.energyLevel,
            openingHours: candidate.openingHours,
            whyRecommended: candidate.whyRecommended,
            strategicFit: candidate.strategicFit
          },
          request.city,
          {
            itineraryId: this.context.itineraryId,
            date: request.date,
            scheduledTime: request.timeWindow.start
          }
        );

        if (result.valid) {
          // Check availability if scheduled time provided
          let availabilityResult = null;
          if (request.date && request.timeWindow.start) {
            const scheduledDateTime = this.parseDateTime(request.date, request.timeWindow.start);

            availabilityResult = await this.validationOrchestrator.availabilityValidator.checkAvailability(
              result.place,
              scheduledDateTime
            );
          }

          validationResults.push({
            valid: true,
            candidate: candidate,
            place: result.place,
            confidence: result.confidence,
            status: 'validated',
            availability: availabilityResult
          });
        } else {
          validationResults.push({
            valid: false,
            candidate: candidate,
            status: result.status,
            reason: result.reason || result.status,
            confidence: result.confidence || 0
          });
        }

      } catch (error) {
        console.error(`   ❌ Validation error for "${candidate.name}":`, error.message);

        validationResults.push({
          valid: false,
          candidate: candidate,
          status: 'error',
          reason: error.message,
          confidence: 0
        });
      }
    }

    return validationResults;
  }

  /**
   * Score and select best candidate from valid options
   */
  async selectBestCandidate(validCandidates, request) {
    const scored = validCandidates.map(candidate => {
      let score = 0;
      const reasoningParts = [];

      // 1. Quality score from Google Places validation (40 points max)
      if (candidate.place.qualityScore) {
        const qualityPoints = candidate.place.qualityScore * 40;
        score += qualityPoints;
        reasoningParts.push(`Quality: ${candidate.place.qualityScore.toFixed(2)} (+${qualityPoints.toFixed(1)}pts)`);
      }

      // 2. Rating bonus (20 points max)
      if (candidate.place.rating) {
        if (candidate.place.rating >= 4.5) {
          score += 20;
          reasoningParts.push(`Excellent rating: ${candidate.place.rating}⭐ (+20pts)`);
        } else if (candidate.place.rating >= 4.0) {
          score += 10;
          reasoningParts.push(`Good rating: ${candidate.place.rating}⭐ (+10pts)`);
        } else if (candidate.place.rating >= 3.5) {
          score += 5;
          reasoningParts.push(`Fair rating: ${candidate.place.rating}⭐ (+5pts)`);
        }
      }

      // 3. Strategic fit (20 points max)
      if (candidate.candidate.strategicFit === 'high') {
        score += 20;
        reasoningParts.push('High strategic fit (+20pts)');
      } else if (candidate.candidate.strategicFit === 'medium') {
        score += 10;
        reasoningParts.push('Medium strategic fit (+10pts)');
      }

      // 4. Proximity to previous location (15 points max)
      const lastLocation = this.context.getLastLocation();
      if (lastLocation && candidate.place.coordinates) {
        const distance = this.calculateDistance(lastLocation, candidate.place.coordinates);
        if (distance < 0.5) {
          score += 15;
          reasoningParts.push(`Very close: ${(distance * 1000).toFixed(0)}m (+15pts)`);
        } else if (distance < 1.0) {
          score += 10;
          reasoningParts.push(`Walking distance: ${distance.toFixed(1)}km (+10pts)`);
        } else if (distance < 2.0) {
          score += 5;
          reasoningParts.push(`Nearby: ${distance.toFixed(1)}km (+5pts)`);
        }
      }

      // 5. Availability confidence (5 points max)
      if (candidate.availability) {
        if (candidate.availability.status && candidate.availability.confidence >= 0.9) {
          score += 5;
          reasoningParts.push('High availability confidence (+5pts)');
        } else if (candidate.availability.status && candidate.availability.confidence >= 0.7) {
          score += 3;
          reasoningParts.push('Good availability confidence (+3pts)');
        } else if (!candidate.availability.status) {
          score -= 10;
          reasoningParts.push('CLOSED at scheduled time (-10pts)');
        }
      }

      return {
        ...candidate,
        score: score,
        reasoning: reasoningParts.join('; ')
      };
    });

    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);

    const best = scored[0];

    // Add rejection reasons for alternatives
    for (let i = 1; i < scored.length; i++) {
      const diff = best.score - scored[i].score;
      scored[i].rejectionReason = `Lower score by ${diff.toFixed(1)} points`;
    }

    return {
      place: best.place,
      score: best.score,
      reasoning: best.reasoning,
      confidence: Math.min(best.score / 100, 1.0) // Normalize to 0-1
    };
  }

  /**
   * Analyze why validation failed
   */
  analyzeValidationFailures(candidates, validationResults) {
    const failures = validationResults
      .filter(r => !r.valid)
      .map(r => ({
        name: r.candidate.name,
        reason: r.status || r.reason || 'unknown',
        availability: r.availability
      }));

    // Categorize failures
    const closedPlaces = failures.filter(f =>
      f.reason.toLowerCase().includes('closed') ||
      f.reason.toLowerCase().includes('unavailable')
    );
    const notFound = failures.filter(f => f.reason === 'not_found');
    const ambiguous = failures.filter(f => f.reason === 'ambiguous' || f.reason.toLowerCase().includes('confidence'));

    let feedback = '';
    const suggestions = [];

    if (closedPlaces.length > 0) {
      feedback += `${closedPlaces.length} places closed at scheduled time. `;
      suggestions.push('emphasize_opening_hours');
      suggestions.push('require_open_confirmation');
    }

    if (notFound.length > 0) {
      feedback += `${notFound.length} places not found in Google Places. `;
      suggestions.push('require_exact_address');
      suggestions.push('prefer_well_known');
    }

    if (ambiguous.length > 0) {
      feedback += `${ambiguous.length} places had low confidence matches. `;
      suggestions.push('avoid_generic_names');
      suggestions.push('require_unique_identifiers');
    }

    return {
      failures,
      closedPlaces,
      notFound,
      ambiguous,
      feedback: feedback || 'Unknown validation failures',
      suggestions
    };
  }

  /**
   * Update request based on failure feedback
   */
  updateRequestWithFeedback(request, failureAnalysis) {
    const updated = { ...request };
    updated.updatedConstraints = updated.updatedConstraints || [];

    // Apply suggestions from failure analysis
    for (const suggestion of failureAnalysis.suggestions) {
      switch (suggestion) {
        case 'emphasize_opening_hours':
          updated.emphasizeOpeningHours = true;
          updated.updatedConstraints.push('Emphasize opening hours verification');
          break;

        case 'require_open_confirmation':
          updated.requireOpenConfirmation = true;
          updated.updatedConstraints.push('Require explicit confirmation place is open');
          break;

        case 'require_exact_address':
          updated.requireExactAddress = true;
          updated.updatedConstraints.push('Require exact street address');
          break;

        case 'prefer_well_known':
          updated.preferWellKnown = true;
          updated.updatedConstraints.push('Prefer well-known, established venues');
          break;

        case 'avoid_generic_names':
          updated.avoidGenericNames = true;
          updated.updatedConstraints.push('Avoid generic activity descriptions');
          break;

        case 'require_unique_identifiers':
          updated.requireUniqueIdentifiers = true;
          updated.updatedConstraints.push('Include unique identifying details');
          break;
      }
    }

    return updated;
  }

  /**
   * Helper: Calculate distance between coordinates (Haversine formula)
   */
  calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLon = this.toRad(coord2.lng - coord1.lng);
    const lat1 = this.toRad(coord1.lat);
    const lat2 = this.toRad(coord2.lat);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in km
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Helper: Parse date and time into Date object
   */
  parseDateTime(dateStr, timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(dateStr);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  /**
   * Build failure response
   */
  buildFailureResponse(attempts, reason) {
    return {
      success: false,
      attempts: attempts,
      reason: reason,
      fallback: true
    };
  }
}

module.exports = OrchestratorAgent;
