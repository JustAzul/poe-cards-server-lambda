import {
  DivCardDefinition,
  IDivCardDefinitionSource,
} from '@infrastructure/ports/div-card-definition-source.port';
import { ExplicitModifier } from '@domain/services/reward-parser.service';
import { PoeAtlasCardDetail } from '@infrastructure/types/poeatlas.types';
import { HttpClient } from '@infrastructure/adapters/http/http-client';
import { Logger } from '@shared/logger';

const DIV_CARD_DETAILS_URL = 'https://data.poeatlas.app/divinationCardDetails.json';

/**
 * Div-card definition source backed by data.poeatlas.app.
 * One bulk GET per run recovers the reward text, art, flavour and stack size
 * that the poe.ninja exchange endpoint no longer carries. Keyed by card slug so
 * the league adapter can join exchange price lines by id.
 */
export class PoeAtlasService implements IDivCardDefinitionSource {
  constructor(
    private readonly client: HttpClient,
    private readonly logger: Logger,
  ) {}

  async fetchDefinitions(): Promise<Map<string, DivCardDefinition>> {
    const response = await this.client.get<PoeAtlasCardDetail[]>(DIV_CARD_DETAILS_URL);

    if (!Array.isArray(response)) {
      this.logger.warn('[PoeAtlasService] Unexpected divinationCardDetails shape — degrading to no definitions');
      return new Map();
    }

    const definitions = new Map<string, DivCardDefinition>();
    let droppedCount = 0;
    let malformedModifierCount = 0;

    for (const entry of response) {
      const mapped = PoeAtlasService.toDefinition(entry);

      if (mapped) {
        definitions.set(mapped.slug, mapped.definition);
        if (mapped.malformedModifiers) malformedModifierCount += 1;
      } else {
        droppedCount += 1;
      }
    }

    if (droppedCount > 0) {
      this.logger.warn(`[PoeAtlasService] Dropped ${droppedCount} card definitions with no usable slug/name`);
    }

    if (malformedModifierCount > 0) {
      this.logger.warn(`[PoeAtlasService] ${malformedModifierCount} definitions had malformed explicitModifiers (skipped downstream by the parser)`);
    }

    return definitions;
  }

  /**
   * Validate one raw entry and map it to a slug-keyed definition.
   * Returns null when the slug or name is missing (e.g. gamble cards with a
   * null detailsId) — those cannot join to an exchange price line.
   * `malformedModifiers` flags an entry whose reward text was present but
   * unusable, so the caller can surface it rather than dropping it silently.
   */
  private static toDefinition(
    entry: PoeAtlasCardDetail,
  ): { slug: string; definition: DivCardDefinition; malformedModifiers: boolean } | null {
    const slug = entry.detailsId ?? entry.id ?? null;

    if (typeof slug !== 'string' || slug.length === 0) return null;
    if (typeof entry.name !== 'string' || entry.name.length === 0) return null;

    const { modifiers, malformed } = PoeAtlasService.normalizeModifiers(entry.explicitModifiers);

    return {
      slug,
      malformedModifiers: malformed,
      definition: {
        name: entry.name,
        explicitModifiers: modifiers,
        artFilename: entry.artFilename,
        flavourText: entry.flavourText,
        stackSize: entry.stackSize,
      },
    };
  }

  /**
   * Validate raw external modifiers before they reach the (unchanged) parser.
   * Keeps only well-shaped `{ text, optional }` entries and coerces `optional`
   * strictly (only a real boolean true is optional). Reports `malformed` when
   * the reward text was present but unusable (non-array, or an array with
   * entries but none usable) so the boundary reason isn't lost; a legitimately
   * absent list (null/undefined, e.g. gamble cards) is not malformed.
   */
  private static normalizeModifiers(
    raw: unknown,
  ): { modifiers?: ExplicitModifier[]; malformed: boolean } {
    if (raw === null || raw === undefined) return { malformed: false };
    if (!Array.isArray(raw)) return { malformed: true };

    const valid = raw
      .filter((mod): mod is { text: string; optional?: unknown } => (
        typeof mod === 'object' && mod !== null && typeof (mod as { text?: unknown }).text === 'string'
      ))
      .map((mod) => ({ text: mod.text, optional: mod.optional === true }));

    if (valid.length === 0) return { malformed: raw.length > 0 };

    return { modifiers: valid, malformed: false };
  }
}
