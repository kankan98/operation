import { z } from 'zod';

// Scrape Result Schema
export const scrapeResultSchema = z.object({
  success: z.boolean(),
  productId: z.string().optional(),
  price: z.number().optional(),
  error: z.string().optional(),
  timestamp: z.number().optional(),
});

// Scrape All Results Schema
export const scrapeAllResultsSchema = z.object({
  total: z.number(),
  success: z.number(),
  failed: z.number(),
  results: z.array(scrapeResultSchema),
});

// Export types
export type ScrapeResult = z.infer<typeof scrapeResultSchema>;
export type ScrapeAllResults = z.infer<typeof scrapeAllResultsSchema>;
