import { describe, expect, it } from 'vitest';
import type { AcquisitionProductJobDiagnostics } from '@/types';
import {
  deriveAcquisitionOperationalState,
  matchesAcquisitionOperationalFilter,
} from './Opportunities';

const ACQUISITION_QUEUE_CAVEAT =
  'Queue health describes acquisition operations only. It is not verified evidence of sales, demand, margin, ROI, or profitability.';

describe('opportunity acquisition operations state', () => {
  it('marks failed retryable jobs as actionable without changing score semantics', () => {
    const state = deriveAcquisitionOperationalState(
      diagnostics({
        job: jobState({ status: 'failed', retryable: true, cancellable: false }),
      }),
    );

    expect(state.kind).toBe('retryable');
    expect(state.retryable).toBe(true);
    expect(matchesAcquisitionOperationalFilter(state, 'retryable')).toBe(true);
    expect(matchesAcquisitionOperationalFilter(state, 'delayed')).toBe(false);
    expect(state.caveat).toBe(ACQUISITION_QUEUE_CAVEAT);
  });

  it('marks provider gates as delayed acquisition operations', () => {
    const state = deriveAcquisitionOperationalState(
      diagnostics({
        providerGate: {
          platform: 'amazon',
          provider: 'rainforest',
          status: 'rate_limited',
          resetAt: 1_725_000_000_000,
          currentConcurrency: 0,
          maxConcurrency: 2,
          activeCount: 0,
          recentRootCauses: ['rate_limited'],
          recommendations: [
            {
              code: 'wait_for_reset',
              severity: 'warning',
              message: 'Wait for provider reset before retrying.',
            },
          ],
          updatedAt: 1_724_999_990_000,
        },
      }),
    );

    expect(state.kind).toBe('delayed');
    expect(state.delayed).toBe(true);
    expect(matchesAcquisitionOperationalFilter(state, 'delayed')).toBe(true);
    expect(matchesAcquisitionOperationalFilter(state, 'retryable')).toBe(false);
  });

  it('keeps empty job history neutral', () => {
    const state = deriveAcquisitionOperationalState(diagnostics());

    expect(state.kind).toBe('no_history');
    expect(state.retryable).toBe(false);
    expect(state.delayed).toBe(false);
    expect(matchesAcquisitionOperationalFilter(state, 'all')).toBe(true);
    expect(matchesAcquisitionOperationalFilter(state, 'delayed')).toBe(false);
  });
});

function diagnostics(
  overrides: Partial<AcquisitionProductJobDiagnostics> = {},
): AcquisitionProductJobDiagnostics {
  return {
    productId: 'product-1',
    job: null,
    latestAttempt: null,
    providerGate: null,
    recommendations: [],
    caveat: ACQUISITION_QUEUE_CAVEAT,
    generatedAt: 1_725_000_000_000,
    ...overrides,
  };
}

function jobState(
  overrides: Partial<NonNullable<AcquisitionProductJobDiagnostics['job']>> = {},
): NonNullable<AcquisitionProductJobDiagnostics['job']> {
  return {
    id: 'job-1',
    productId: 'product-1',
    status: 'pending',
    priority: 0,
    attemptCount: 0,
    maxAttempts: 3,
    nextRunAt: 1_725_000_000_000,
    leaseOwner: null,
    leaseExpiresAt: null,
    lastAttemptId: null,
    lastFailureReason: null,
    createdAt: 1_724_999_000_000,
    updatedAt: 1_724_999_500_000,
    completedAt: null,
    retryable: false,
    cancellable: true,
    delayReason: null,
    ...overrides,
  };
}
