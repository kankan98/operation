import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import type { Availability } from '@/types';

export type ManualReadingInput = {
  price: number;
  currency: string;
  availability: Availability;
  source: 'manual';
  salesRank?: number;
  rating?: number;
  reviewCount?: number;
  recordedAt?: number;
};

interface ManualReadingFormProps {
  currency: string;
  isSaving: boolean;
  isError: boolean;
  isSuccess: boolean;
  onSubmit: (data: ManualReadingInput) => void;
}

const availabilityOptionLabels: Record<Availability, string> = {
  in_stock: '有货',
  low_stock: '库存偏低',
  out_of_stock: '缺货',
};

export function ManualReadingForm({
  currency,
  isSaving,
  isError,
  isSuccess,
  onSubmit,
}: ManualReadingFormProps) {
  const [form, setForm] = useState({
    price: '',
    availability: 'in_stock' as Availability,
    salesRank: '',
    rating: '',
    reviewCount: '',
    recordedAt: '',
  });
  const [clearOnNextSuccess, setClearOnNextSuccess] = useState(false);
  const previousSuccess = useRef(isSuccess);

  useEffect(() => {
    const saveJustSucceeded = !previousSuccess.current && isSuccess;
    previousSuccess.current = isSuccess;

    if (!saveJustSucceeded || !clearOnNextSuccess) return;

    setForm((current) => ({
      ...current,
      price: '',
      salesRank: '',
      rating: '',
      reviewCount: '',
      recordedAt: '',
    }));
    setClearOnNextSuccess(false);
  }, [clearOnNextSuccess, isSuccess]);

  const update = (field: string, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const price = Number(form.price);
    if (!Number.isFinite(price) || form.price.trim() === '') return;

    const recordedAt = form.recordedAt
      ? new Date(form.recordedAt).getTime()
      : undefined;

    onSubmit({
      price,
      currency,
      availability: form.availability,
      source: 'manual',
      salesRank: numberOrUndefined(form.salesRank),
      rating: numberOrUndefined(form.rating),
      reviewCount: numberOrUndefined(form.reviewCount),
      recordedAt: recordedAt && Number.isFinite(recordedAt) ? recordedAt : undefined,
    });
    setClearOnNextSuccess(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="block text-sm font-medium text-fg-muted">
          价格 ({currency}) *
          <input
            type="number"
            min={0}
            step="0.01"
            required
            value={form.price}
            onChange={(e) => update('price', e.target.value)}
            className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg"
          />
        </label>
        <label className="block text-sm font-medium text-fg-muted">
          库存状态
          <select
            value={form.availability}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                availability: e.target.value as Availability,
              }))
            }
            className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg"
          >
            {Object.entries(availabilityOptionLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-fg-muted">
          销量排名 (BSR)
          <input
            type="number"
            min={0}
            step="1"
            value={form.salesRank}
            onChange={(e) => update('salesRank', e.target.value)}
            className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg"
          />
        </label>
        <label className="block text-sm font-medium text-fg-muted">
          评分
          <input
            type="number"
            min={0}
            max={5}
            step="0.1"
            value={form.rating}
            onChange={(e) => update('rating', e.target.value)}
            className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg"
          />
        </label>
        <label className="block text-sm font-medium text-fg-muted">
          评论数
          <input
            type="number"
            min={0}
            step="1"
            value={form.reviewCount}
            onChange={(e) => update('reviewCount', e.target.value)}
            className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg"
          />
        </label>
        <label className="block text-sm font-medium text-fg-muted">
          采集日期（补录历史时填）
          <input
            type="date"
            value={form.recordedAt}
            onChange={(e) => update('recordedAt', e.target.value)}
            className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg"
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-xs text-fg-muted">
          手动录入的数字是某一时点的快照，不会自动刷新；系统按来源和时间提示可信度，绝不把过时数据当作当前事实。
        </p>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? '保存中' : '保存读数'}
        </Button>
      </div>
      {isError ? (
        <p role="alert" className="text-sm text-error">
          保存失败，请检查价格等输入后重试。
        </p>
      ) : null}
      {isSuccess ? (
        <p className="text-sm text-success">已记录一条手动读数。</p>
      ) : null}
    </form>
  );
}

function numberOrUndefined(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
