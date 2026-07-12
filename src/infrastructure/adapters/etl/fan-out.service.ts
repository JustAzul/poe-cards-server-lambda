import axios from 'axios';
import { Logger } from '@shared/logger';

const MAX_ATTEMPTS = 2; // one retry after the initial attempt

/**
 * Notifies downstream services (revalidate cache, broadcast update) after an R2 write.
 * Failures are logged and swallowed — a fan-out failure for one league must never
 * stop the ETL loop from processing the remaining leagues.
 */
export class FanOutService {
  private warnedMissingConfig = false;

  private warnedMissingRevalidateUrl = false;

  private warnedMissingBroadcastUrl = false;

  constructor(private readonly logger: Logger) {}

  async notifyLeagueUpdated(leagueName: string): Promise<void> {
    const revalidateUrl = process.env.REVALIDATE_URL;
    const broadcastUrl = process.env.BROADCAST_URL;

    if (!this.warnAndCheckLeagueConfig(revalidateUrl, broadcastUrl)) return;

    const revalidated = revalidateUrl
      ? await this.postWithRetry(
        revalidateUrl,
        { leagueName },
        process.env.REVALIDATE_SECRET,
        `revalidate for ${leagueName}`,
      )
      : true;

    if (!revalidated || !broadcastUrl) return;

    await this.postWithRetry(
      `${broadcastUrl}/${encodeURIComponent(leagueName)}`,
      { leagueName },
      process.env.BROADCAST_SECRET,
      `broadcast for ${leagueName}`,
    );
  }

  /**
   * Notifies the revalidate endpoint that index.json changed, independent of any
   * single league. No `leagueName` in the body — the handler always revalidates `/`
   * and only revalidates a per-league path when `leagueName` is present. Broadcast is
   * league-specific and is intentionally not hit here.
   */
  async notifyIndexUpdated(): Promise<void> {
    const revalidateUrl = process.env.REVALIDATE_URL;

    if (!revalidateUrl) {
      this.warnMissingConfigOnce();
      return;
    }

    await this.postWithRetry(
      revalidateUrl,
      {},
      process.env.REVALIDATE_SECRET,
      'revalidate for index update',
    );
  }

  /**
   * Validates league fan-out config, warning once per gap. Returns false only when
   * both URLs are missing (nothing to do); a single missing URL still warns but
   * lets the other, configured notification proceed.
   */
  private warnAndCheckLeagueConfig(
    revalidateUrl: string | undefined,
    broadcastUrl: string | undefined,
  ): boolean {
    if (!revalidateUrl && !broadcastUrl) {
      this.warnMissingConfigOnce();
      return false;
    }

    if (!revalidateUrl) this.warnMissingRevalidateUrlOnce();
    if (!broadcastUrl) this.warnMissingBroadcastUrlOnce();

    return true;
  }

  private warnMissingConfigOnce(): void {
    if (this.warnedMissingConfig) return;

    this.logger.warn('FanOutService: REVALIDATE_URL/BROADCAST_URL not set — skipping fan-out notifications');
    this.warnedMissingConfig = true;
  }

  private warnMissingRevalidateUrlOnce(): void {
    if (this.warnedMissingRevalidateUrl) return;

    this.logger.warn('FanOutService: REVALIDATE_URL not set — skipping league revalidate notification');
    this.warnedMissingRevalidateUrl = true;
  }

  private warnMissingBroadcastUrlOnce(): void {
    if (this.warnedMissingBroadcastUrl) return;

    this.logger.warn('FanOutService: BROADCAST_URL not set — skipping broadcast notification');
    this.warnedMissingBroadcastUrl = true;
  }

  private async postWithRetry(
    url: string,
    body: Record<string, unknown>,
    secret: string | undefined,
    operationName: string,
  ): Promise<boolean> {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await axios.post(url, body, {
          headers: secret ? { Authorization: `Bearer ${secret}` } : undefined,
        });
        return true;
      } catch (error: unknown) {
        if (attempt === MAX_ATTEMPTS) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.warn(`FanOutService: ${operationName} failed after ${MAX_ATTEMPTS} attempts: ${message}`);
          return false;
        }
      }
    }

    return false;
  }
}
