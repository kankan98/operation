import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Package } from 'lucide-react';
import { ManualReadingForm } from '@/components/products/ManualReadingForm';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductForm, type ProductFormData } from '@/components/products/ProductForm';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '@/hooks/useProducts';
import { useCreateSnapshot } from '@/hooks/usePriceStats';
import type { CreateProduct, Product, UpdateProduct } from '@/types';

function normalizeProductData(data: ProductFormData): CreateProduct {
  return {
    ...data,
    brand: data.brand || undefined,
    category: data.category || undefined,
    imageUrl: data.imageUrl || undefined,
    currentPrice: data.currentPrice ?? undefined,
    monitorType: data.monitorType || undefined,
  };
}

function readMutationReason(
  error: unknown,
  fallback: string,
  duplicateUrlReason: string,
): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const data = (error as { response?: { data?: unknown } }).response?.data;
    if (data && typeof data === 'object') {
      const message = (data as { message?: unknown; error?: unknown; code?: unknown }).message;
      if (typeof message === 'string' && message.trim()) {
        if (message === 'Product URL already exists') {
          return duplicateUrlReason;
        }
        return message;
      }

      const responseError = (data as { error?: unknown }).error;
      if (typeof responseError === 'string' && responseError.trim()) {
        return responseError;
      }

      const code = (data as { code?: unknown }).code;
      if (code === 'DUPLICATE_URL') {
        return duplicateUrlReason;
      }
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export function ProductsList() {
  const navigate = useNavigate();
  const { t } = useTranslation(['products', 'common']);
  const { data: products, isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [selectedForReading, setSelectedForReading] = useState<Product | null>(null);
  const [addSubmitError, setAddSubmitError] = useState<string | null>(null);
  const [editSubmitError, setEditSubmitError] = useState<string | null>(null);
  const createSnapshot = useCreateSnapshot(selectedForReading?.id ?? '');

  const openAddDialog = () => {
    setAddSubmitError(null);
    setIsAddOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelected(product);
    setEditSubmitError(null);
    setIsEditOpen(true);
  };

  const handleDelete = (id: string) => {
    const product = products?.find((p) => p.id === id);
    if (product) {
      setSelected(product);
      setIsDeleteOpen(true);
    }
  };

  const handleRecordReading = (product: Product) => {
    setSelectedForReading(product);
  };

  const handleAddSubmit = async (data: ProductFormData) => {
    setAddSubmitError(null);
    try {
      const createdProduct = await createProduct.mutateAsync(normalizeProductData(data));
      setIsAddOpen(false);
      navigate(`/products/${createdProduct.id}`, {
        state: { fromProductCreate: true },
      });
    } catch (error) {
      setAddSubmitError(
        t('form.createFailed', {
          reason: readMutationReason(
            error,
            t('form.submitErrorFallback'),
            t('form.duplicateUrlReason'),
          ),
        }),
      );
    }
  };

  const handleEditSubmit = async (data: ProductFormData) => {
    if (selected) {
      setEditSubmitError(null);
      try {
        await updateProduct.mutateAsync({
          id: selected.id,
          data: normalizeProductData(data) as UpdateProduct,
        });
        setIsEditOpen(false);
        setSelected(null);
      } catch (error) {
        setEditSubmitError(
          t('form.updateFailed', {
            reason: readMutationReason(
              error,
              t('form.submitErrorFallback'),
              t('form.duplicateUrlReason'),
            ),
          }),
        );
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (selected) {
      await deleteProduct.mutateAsync(selected.id);
      setIsDeleteOpen(false);
      setSelected(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-80 animate-skeleton rounded-card" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">{t('title')}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {t('subtitle', { count: products?.length || 0 })}
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4" />
          {t('addProduct')}
        </Button>
      </div>

      {/* Grid */}
      {products && products.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onView={(id) => navigate(`/products/${id}`)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRecordReading={handleRecordReading}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-card border border-border-subtle bg-surface p-16 text-center shadow-e1">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[16px] bg-primary-50">
            <Package className="h-7 w-7 text-primary-600" />
          </div>
          <h3 className="text-base font-semibold text-fg">{t('noProductsTitle')}</h3>
          <p className="mb-6 mt-1 text-sm text-fg-muted">{t('noProductsDesc')}</p>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4" />
            {t('addProduct')}
          </Button>
        </div>
      )}

      {/* Modals */}
      {isAddOpen && (
        <Modal
          title={t('form.addTitle')}
          onClose={() => {
            setIsAddOpen(false);
            setAddSubmitError(null);
          }}
        >
          <ProductForm
            onSubmit={handleAddSubmit}
            onCancel={() => {
              setIsAddOpen(false);
              setAddSubmitError(null);
            }}
            submissionError={addSubmitError}
          />
        </Modal>
      )}

      {isEditOpen && selected && (
        <Modal
          title={t('form.editTitle')}
          onClose={() => {
            setIsEditOpen(false);
            setSelected(null);
            setEditSubmitError(null);
          }}
        >
          <ProductForm
            product={selected}
            onSubmit={handleEditSubmit}
            onCancel={() => {
              setIsEditOpen(false);
              setSelected(null);
              setEditSubmitError(null);
            }}
            submissionError={editSubmitError}
          />
        </Modal>
      )}

      {isDeleteOpen && selected && (
        <Modal
          title={t('deleteTitle')}
          onClose={() => {
            setIsDeleteOpen(false);
            setSelected(null);
          }}
        >
          <div className="space-y-5">
            <p className="text-sm text-fg-muted">{t('deleteConfirm', { title: selected.title })}</p>
            <div className="flex items-center gap-3 border-t border-border-subtle pt-5">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setIsDeleteOpen(false);
                  setSelected(null);
                }}
              >
                {t('common:cancel')}
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleDeleteConfirm}
                disabled={deleteProduct.isPending}
              >
                {deleteProduct.isPending ? t('deleting') : t('common:delete')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {selectedForReading && (
        <Modal
          title="记录手动读数"
          className="max-w-3xl"
          onClose={() => setSelectedForReading(null)}
        >
          <div className="mb-4 rounded-md border border-border-subtle bg-canvas px-3 py-2">
            <p className="line-clamp-2 text-sm font-medium text-fg">
              {selectedForReading.title}
            </p>
            <p className="mt-1 text-xs text-fg-muted">
              保存后会刷新产品列表和机会工作台中的当前价与新鲜度。
            </p>
          </div>
          <ManualReadingForm
            currency={selectedForReading.currency}
            isSaving={createSnapshot.isPending}
            isError={createSnapshot.isError}
            isSuccess={createSnapshot.isSuccess}
            onSubmit={(data) =>
              createSnapshot.mutate(
                { productId: selectedForReading.id, ...data },
                { onSuccess: () => setSelectedForReading(null) },
              )
            }
          />
        </Modal>
      )}
    </div>
  );
}
