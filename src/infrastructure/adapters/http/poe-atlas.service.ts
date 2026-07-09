import {
  DivCardDefinition,
  IDivCardDefinitionSource,
} from '@infrastructure/ports/div-card-definition-source.port';
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

    for (const entry of response) {
      const mapped = PoeAtlasService.toDefinition(entry);

      if (mapped) {
        definitions.set(mapped.slug, mapped.definition);
      } else {
        droppedCount += 1;
      }
    }

    if (droppedCount > 0) {
      this.logger.warn(`[PoeAtlasService] Dropped ${droppedCount} card definitions with no usable slug/name`);
    }

    return definitions;
  }

  /**
   * Validate one raw entry and map it to a slug-keyed definition.
   * Returns null when the slug or name is missing (e.g. gamble cards with a
   * null detailsId) — those cannot join to an exchange price line.
   */
  private static toDefinition(
    entry: PoeAtlasCardDetail,
  ): { slug: string; definition: DivCardDefinition } | null {
    const slug = entry.detailsId ?? entry.id ?? null;

    if (typeof slug !== 'string' || slug.length === 0) return null;
    if (typeof entry.name !== 'string' || entry.name.length === 0) return null;

    return {
      slug,
      definition: {
        name: entry.name,
        explicitModifiers: entry.explicitModifiers ?? undefined,
        artFilename: entry.artFilename,
        flavourText: entry.flavourText,
        stackSize: entry.stackSize,
      },
    };
  }
}
