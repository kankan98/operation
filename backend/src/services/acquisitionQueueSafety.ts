import { queueSafeMetadataSchema } from '@shared/schemas';

const unsafeKeyPattern =
  /(secret|token|api[_-]?key|authorization|cookie|password|credential|redis[_-]?url|raw[_-]?(html|payload|response)|html|payload)/i;

const unsafeValuePattern =
  /(redis:\/\/[^:@\s]+:[^@\s]+@|authorization\s*[:=]|bearer\s+[a-z0-9._~+/=-]+|api[_-]?key\s*[:=]|cookie\s*[:=]|<html[\s>]|<!doctype\s+html)/i;

export function parseJsonRecord(value?: string | null): Record<string, unknown> | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

export function stringifySafeMetadata(
  metadata?: Record<string, unknown> | null
): string | undefined {
  const safe = sanitizeQueueMetadata(metadata);
  return safe ? JSON.stringify(safe) : undefined;
}

export function sanitizeQueueMetadata(
  metadata?: Record<string, unknown> | null
): Record<string, unknown> | undefined {
  if (!metadata) return undefined;

  const redacted = redactUnsafeValue(metadata, 0);
  if (!redacted || typeof redacted !== 'object' || Array.isArray(redacted)) {
    return undefined;
  }

  const parsed = queueSafeMetadataSchema.safeParse(redacted);
  return parsed.success ? parsed.data : undefined;
}

function redactUnsafeValue(value: unknown, depth: number): unknown {
  if (depth > 3) {
    return undefined;
  }

  if (typeof value === 'string') {
    if (unsafeValuePattern.test(value)) {
      return '[redacted]';
    }
    return value.length > 500 ? `${value.slice(0, 497)}...` : value;
  }

  if (
    value === null ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, 20)
      .map((item) => redactUnsafeValue(item, depth + 1))
      .filter((item) => item !== undefined);
  }

  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>).slice(0, 20)) {
      if (unsafeKeyPattern.test(key)) {
        continue;
      }
      const redacted = redactUnsafeValue(child, depth + 1);
      if (redacted !== undefined) {
        output[key] = redacted;
      }
    }
    return output;
  }

  return undefined;
}
