import express, { Request, Response } from 'express';
import { EtlRuntime } from '@runtime/etl-runtime';
import { Logger } from '@shared/logger';

export function createHttpServer(runtime: EtlRuntime, logger: Logger) {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ ok: true, mode: 'http' });
  });

  app.get('/status', (_req: Request, res: Response) => {
    res.json(runtime.getStatus());
  });

  app.post('/refresh', async (_req: Request, res: Response) => {
    try {
      const result = await runtime.refresh();
      res.json({ message: 'Refresh completed', ...result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('HTTP refresh failed:', error);
      res.status(500).json({ error: message });
    }
  });

  return app;
}
