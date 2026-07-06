import { useId } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import type { Product, Platform } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input, Select, Label } from '@/components/ui/Input';

// Frontend-specific product form schema (without backend-only fields)
const blankToUndefined = (value: string | undefined) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const optionalString = (max: number) =>
  z.string().max(max).optional().transform(blankToUndefined);

const optionalUrl = () =>
  z
    .string()
    .optional()
    .transform(blankToUndefined)
    .pipe(z.string().url('Must be a valid URL').optional());

const productFormSchema = z.object({
  platform: z.enum(['amazon', 'walmart', 'aliexpress', 'ebay', 'other']),
  productUrl: z.string().url('Must be a valid URL'),
  asin: z.string().min(1, 'ASIN/Product ID is required').max(50),
  title: z.string().min(1, 'Title is required').max(500),
  brand: optionalString(100),
  category: optionalString(100),
  imageUrl: optionalUrl(),
  currentPrice: z.number().positive().optional(),
  currency: z.string().length(3),
  isMonitoring: z.boolean(),
  checkInterval: z.number().int().min(1).max(168),
  monitorType: z.enum(['manual', 'scheduled']).optional(),
});

export type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
}

const platforms: { value: Platform; label: string }[] = [
  { value: 'amazon', label: 'Amazon' },
  { value: 'walmart', label: 'Walmart' },
  { value: 'aliexpress', label: 'AliExpress' },
  { value: 'ebay', label: 'eBay' },
  { value: 'other', label: 'Other' },
];

export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const formId = useId();
  const fieldId = (name: string) => `${formId}-${name}`;
  const { t } = useTranslation(['products', 'common']);
  const monitorType =
    product?.monitorType === 'manual' || product?.monitorType === 'scheduled'
      ? product.monitorType
      : undefined;
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product ? {
      platform: product.platform,
      productUrl: product.productUrl,
      asin: product.asin,
      title: product.title,
      brand: product.brand || '',
      category: product.category || '',
      imageUrl: product.imageUrl || '',
      currentPrice: product.currentPrice ?? undefined,
      currency: product.currency,
      isMonitoring: product.isMonitoring,
      checkInterval: product.checkInterval,
      monitorType,
    } : {
      platform: 'amazon' as Platform,
      productUrl: '',
      asin: '',
      title: '',
      brand: '',
      category: '',
      currency: 'USD',
      isMonitoring: true,
      checkInterval: 24,
    },
  });

  const isMonitoring = useWatch({ control: form.control, name: 'isMonitoring' });
  const { errors } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <Label htmlFor={fieldId('platform')}>
          {t('form.platform')} <span className="text-error">*</span>
        </Label>
        <Select id={fieldId('platform')} {...form.register('platform')}>
          {platforms.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor={fieldId('productUrl')}>
          {t('form.productUrl')} <span className="text-error">*</span>
        </Label>
        <Input
          id={fieldId('productUrl')}
          type="url"
          placeholder="https://www.amazon.com/dp/..."
          error={!!errors.productUrl}
          {...form.register('productUrl')}
        />
        {errors.productUrl && (
          <p className="mt-1.5 text-sm text-error">{t('form.errUrl')}</p>
        )}
      </div>

      <div>
        <Label htmlFor={fieldId('asin')}>
          {t('form.asin')} <span className="text-error">*</span>
        </Label>
        <Input id={fieldId('asin')} placeholder="B0XXXXXXXX" error={!!errors.asin} {...form.register('asin')} />
        {errors.asin && <p className="mt-1.5 text-sm text-error">{t('form.errAsin')}</p>}
      </div>

      <div>
        <Label htmlFor={fieldId('title')}>
          {t('form.productTitle')} <span className="text-error">*</span>
        </Label>
        <Input id={fieldId('title')} error={!!errors.title} {...form.register('title')} />
        {errors.title && <p className="mt-1.5 text-sm text-error">{t('form.errTitle')}</p>}
      </div>

      <div>
        <Label htmlFor={fieldId('brand')}>{t('form.brand')}</Label>
        <Input id={fieldId('brand')} placeholder={t('form.optional')} {...form.register('brand')} />
      </div>

      <div>
        <Label htmlFor={fieldId('currency')}>
          {t('form.currency')} <span className="text-error">*</span>
        </Label>
        <Input
          id={fieldId('currency')}
          maxLength={3}
          className="uppercase"
          error={!!errors.currency}
          {...form.register('currency')}
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-input border border-border bg-subtle/50 p-4">
        <input
          type="checkbox"
          {...form.register('isMonitoring')}
          className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border text-primary-600 focus:ring-primary-200"
        />
        <span className="flex-1">
          <span className="block text-sm font-medium text-fg">{t('form.enableMonitoring')}</span>
          <span className="mt-0.5 block text-xs text-fg-muted">
            {t('form.enableMonitoringDesc')}
          </span>
        </span>
      </label>

      {isMonitoring && (
        <div>
          <Label htmlFor={fieldId('checkInterval')}>
            {t('form.checkInterval')} <span className="text-error">*</span>
          </Label>
          <Input
            id={fieldId('checkInterval')}
            type="number"
            min="1"
            step="1"
            placeholder="24"
            error={!!errors.checkInterval}
            {...form.register('checkInterval', { valueAsNumber: true })}
          />
          <p className="mt-1.5 text-xs text-fg-muted">{t('form.checkIntervalDesc')}</p>
        </div>
      )}

      <div className="sticky bottom-0 z-10 flex items-center gap-3 border-t border-border-subtle bg-surface pt-5">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={onCancel}
          disabled={form.formState.isSubmitting}
        >
          {t('common:cancel')}
        </Button>
        <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? t('form.saving')
            : product
              ? t('form.update')
              : t('addProduct')}
        </Button>
      </div>
    </form>
  );
}
