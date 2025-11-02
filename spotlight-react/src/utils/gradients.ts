/**
 * Category-based gradient backgrounds for when Wikipedia images are not available
 * Beautiful gradients that match the content type
 */

export type EntityCategory =
  | 'museum'
  | 'restaurant'
  | 'nature'
  | 'historical'
  | 'accommodation'
  | 'scenic'
  | 'activity'
  | 'default';

const gradients: Record<EntityCategory, string> = {
  museum: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  restaurant: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  nature: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  historical: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  accommodation: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  scenic: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  activity: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  default: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
};

/**
 * Get a gradient background based on entity category
 */
export function getGradientForCategory(category: EntityCategory): string {
  return gradients[category] || gradients.default;
}

/**
 * Infer category from entity type and name
 */
export function inferCategory(entityType: string, name?: string): EntityCategory {
  const lowercaseName = name?.toLowerCase() || '';

  // Explicit type mapping
  if (entityType === 'accommodation' || entityType === 'hotel') {
    return 'accommodation';
  }
  if (entityType === 'restaurant') {
    return 'restaurant';
  }
  if (entityType === 'scenic') {
    return 'scenic';
  }

  // Name-based inference for activities
  if (lowercaseName.includes('museum') || lowercaseName.includes('gallery') || lowercaseName.includes('exhibition')) {
    return 'museum';
  }
  if (lowercaseName.includes('park') || lowercaseName.includes('garden') || lowercaseName.includes('beach') || lowercaseName.includes('lake')) {
    return 'nature';
  }
  if (lowercaseName.includes('cathedral') || lowercaseName.includes('church') || lowercaseName.includes('castle') || lowercaseName.includes('palace') || lowercaseName.includes('monument')) {
    return 'historical';
  }

  return entityType === 'activity' ? 'activity' : 'default';
}

/**
 * Get gradient for an entity
 */
export function getEntityGradient(entityType: string, name?: string): string {
  const category = inferCategory(entityType, name);
  return getGradientForCategory(category);
}
