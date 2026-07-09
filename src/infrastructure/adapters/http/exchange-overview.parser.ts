import {
  PoeNinjaExchangeResponse,
  PoeNinjaExchangeCore,
  PoeNinjaExchangeItem,
  PoeNinjaExchangeLine,
} from '@infrastructure/types/poe-ninja-exchange.types';

const CHAOS_PRIMARY = 'chaos';

/** Non-finite/absent exchange volume degrades to 0 (treated as no liquidity). */
export function finiteVolume(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export interface ExchangeParseHooks {
  warn: (message: string) => void;
  /** Context prefix for warn messages, e.g. "PoeNinjaExchangeService Mirage". */
  label: string;
}

/**
 * Shared reader for the poe.ninja normalized exchange shape (`{core, items, lines}`).
 * Owns the boundary-validation invariant for every exchange consumer: validate the
 * shape, normalize `primaryValue` to chaos, join `lines`↔`items` by id, and degrade
 * to empty with a warning — never trust-cast. Each consumer supplies a per-entry
 * mapper that receives the already-chaos-normalized value.
 */
export class ExchangeOverviewParser {
  static parse<T>(
    response: PoeNinjaExchangeResponse,
    mapEntry: (line: PoeNinjaExchangeLine, item: PoeNinjaExchangeItem, chaosValue: number) => T,
    hooks: ExchangeParseHooks,
  ): T[] {
    if (!ExchangeOverviewParser.isWellFormed(response)) {
      hooks.warn(`[${hooks.label}] Unexpected exchange shape — degrading to empty`);
      return [];
    }

    // primaryValue is denominated in core.primary. It is chaos today, but if the
    // base flips (poe.ninja has been shifting toward divine), convert via the
    // chaos rate rather than emitting mislabelled prices. Only degrade if a
    // non-chaos base has no usable chaos rate.
    const chaosMultiplier = ExchangeOverviewParser.chaosMultiplier(response.core);
    if (chaosMultiplier === null) {
      hooks.warn(
        `[${hooks.label}] Exchange primary currency is '${response.core.primary}' with no usable chaos rate — degrading to empty`,
      );
      return [];
    }

    const itemsById = ExchangeOverviewParser.indexItemsById(response.items);
    const out: T[] = [];
    let droppedCount = 0;

    for (const line of response.lines) {
      const item = typeof line.id === 'string' ? itemsById.get(line.id) : undefined;

      if (item && Number.isFinite(line.primaryValue)) {
        out.push(mapEntry(line, item, line.primaryValue * chaosMultiplier));
      } else {
        droppedCount += 1;
      }
    }

    if (droppedCount > 0) {
      hooks.warn(`[${hooks.label}] Dropped ${droppedCount} unjoinable/invalid exchange lines`);
    }

    return out;
  }

  /**
   * Chaos-per-primary multiplier. 1 when the base is already chaos; otherwise the
   * `rates[chaos]` conversion (chaos per one primary unit). Returns null when a
   * non-chaos base carries no usable chaos rate, so the caller degrades to empty.
   */
  private static chaosMultiplier(core: PoeNinjaExchangeCore): number | null {
    if (core.primary === CHAOS_PRIMARY) return 1;

    const chaosRate = core.rates?.[CHAOS_PRIMARY];
    if (typeof chaosRate === 'number' && Number.isFinite(chaosRate) && chaosRate > 0) {
      return chaosRate;
    }

    return null;
  }

  private static isWellFormed(response: PoeNinjaExchangeResponse): boolean {
    return Boolean(response)
      && Array.isArray(response.lines)
      && Array.isArray(response.items)
      && Boolean(response.core)
      && typeof response.core.primary === 'string';
  }

  private static indexItemsById(items: PoeNinjaExchangeItem[]): Map<string, PoeNinjaExchangeItem> {
    const itemsById = new Map<string, PoeNinjaExchangeItem>();

    for (const item of items) {
      if (typeof item.id === 'string' && typeof item.name === 'string') {
        itemsById.set(item.id, item);
      }
    }

    return itemsById;
  }
}
