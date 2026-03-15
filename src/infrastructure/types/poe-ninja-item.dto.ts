import { PoeNinjaItemLine } from './poe-ninja.types';

/**
 * Infrastructure DTO for poe.ninja item overview data.
 * Contains ALL fields from the API response, including presentation-only fields
 * (exaltedValue, divineValue, listingCount, detailsId) that don't belong in domain VOs.
 *
 * Use this type when working with raw API data in the infrastructure layer.
 * Convert to ItemOverview (domain VO) when crossing into the domain layer.
 */
export type PoeNinjaItemDto = PoeNinjaItemLine;
