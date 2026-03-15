import { PoeNinjaCurrencyLine } from './poe-ninja.types';

/**
 * Infrastructure DTO for poe.ninja currency overview data.
 * Contains ALL fields from the API response, including presentation-only fields
 * (pay, detailsId) that don't belong in domain VOs.
 *
 * Use this type when working with raw API data in the infrastructure layer.
 * Convert to CurrencyItem (domain VO) when crossing into the domain layer.
 */
export type PoeNinjaCurrencyDto = PoeNinjaCurrencyLine;
