import { randomUUID } from 'crypto';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { scrapeAttempts } from '../db/schema';
import { AcquisitionDiagnostics, CreateScrapeAttemptData, ScrapeAttempt } from '../types';
import { sanitizeProviderDiagnostics } from '../utils/providerDiagnostics';

export class ScrapeAttemptService {
  async recordAttempt(data: CreateScrapeAttemptData): Promise<ScrapeAttempt> {
    const [attempt] = await db
      .insert(scrapeAttempts)
      .values({
        id: randomUUID(),
        ...data,
        diagnostics: this.sanitizeDiagnosticsString(data.diagnostics),
        timestamp: Date.now(),
      })
      .returning();

    return attempt as ScrapeAttempt;
  }

  async getAttemptsByProduct(
    productId: string,
    options: { limit?: number } = {}
  ): Promise<ScrapeAttempt[]> {
    const { limit = 20 } = options;

    const attempts = await db
      .select()
      .from(scrapeAttempts)
      .where(eq(scrapeAttempts.productId, productId))
      .orderBy(desc(scrapeAttempts.timestamp))
      .limit(limit);

    return attempts as ScrapeAttempt[];
  }

  private sanitizeDiagnosticsString(diagnostics?: string): string | undefined {
    if (!diagnostics) return undefined;

    try {
      const parsed = JSON.parse(diagnostics) as AcquisitionDiagnostics;
      const sanitized = sanitizeProviderDiagnostics(parsed);
      return sanitized ? JSON.stringify(sanitized) : undefined;
    } catch {
      return undefined;
    }
  }
}
