import { useState } from 'react';
import { ExternalLink, Pencil, PencilLine, Trash2, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onView: (id: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onRecordReading?: (product: Product) => void;
}

export function ProductCard({
  product,
  onView,
  onEdit,
  onDelete,
  onRecordReading,
}: ProductCardProps) {
  const { t } = useTranslation('products');
  // Capture "now" once at mount so render stays pure (no Date.now() in render body).
  const [now] = useState(() => Date.now());
  const isStale = product.lastCheckedAt && now - product.lastCheckedAt > 24 * 60 * 60 * 1000;

  return (
    <div className="group flex flex-col overflow-hidden rounded-card border border-border-subtle bg-surface shadow-e1 transition-shadow duration-200 hover:shadow-e2">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-subtle">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-fg-subtle">
            {t('noImage')}
          </div>
        )}

        <div className="absolute left-3 top-3">
          <span className="rounded-badge bg-gray-900/70 px-2.5 py-0.5 text-xs font-medium capitalize text-white backdrop-blur-sm">
            {product.platform}
          </span>
        </div>

        {product.isMonitoring && (
          <div className="absolute right-3 top-3">
            <Badge variant="success" className="bg-success/90 text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              {t('live')}
            </Badge>
          </div>
        )}

        {isStale && (
          <div className="absolute bottom-3 left-3">
            <Badge variant="warning" className="bg-warning/90 text-white">
              {t('stale')}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight text-fg">
          {product.title}
        </h3>

        {product.currentPrice != null && (
          <p className="text-2xl font-bold tabular-nums text-fg">
            {formatCurrency(product.currentPrice, product.currency)}
          </p>
        )}

        <div className="mt-auto space-y-1 text-xs text-fg-muted">
          {product.brand && (
            <div className="flex items-center gap-1.5">
              <span className="text-fg-subtle">{t('brand')}:</span>
              <span className="truncate">{product.brand}</span>
            </div>
          )}
          {product.lastCheckedAt && (
            <div className="flex items-center gap-1.5">
              <span className="text-fg-subtle">{t('lastCheck')}:</span>
              <span className="tabular-nums">{formatDateTime(product.lastCheckedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-border-subtle p-3">
        <Button size="sm" className="flex-1" onClick={() => onView(product.id)}>
          <Eye className="h-4 w-4" />
          {t('view')}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onEdit(product)}
          aria-label={t('editProduct')}
          className={cn('px-2.5')}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        {onRecordReading ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onRecordReading(product)}
            aria-label="记录手动读数"
            className={cn('px-2.5')}
          >
            <PencilLine className="h-4 w-4" />
          </Button>
        ) : null}
        <a
          href={product.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('openProduct')}
          className="flex h-9 items-center rounded-button border border-border bg-surface px-2.5 text-fg transition-colors hover:bg-subtle"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onDelete(product.id)}
          aria-label={t('deleteProduct')}
          className="border-error/30 px-2.5 text-error hover:bg-error/5"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
