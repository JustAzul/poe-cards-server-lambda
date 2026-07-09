import { ExplicitModifier } from '@domain/services/reward-parser.service';

/**
 * Static div-card definition sourced from data.poeatlas.app.
 * Carries the reward text (for the parser) and presentation metadata that the
 * poe.ninja exchange endpoint dropped. Keyed by the card slug (detailsId).
 */
export interface DivCardDefinition {
  name: string;
  explicitModifiers?: ExplicitModifier[];
  artFilename?: string;
  flavourText?: string;
  stackSize?: number;
}

/**
 * Port for fetching div-card definitions. Returns a slug → definition map so the
 * league adapter can join price lines (by slug) to their reward text/metadata.
 */
export interface IDivCardDefinitionSource {
  fetchDefinitions(): Promise<Map<string, DivCardDefinition>>;
}
