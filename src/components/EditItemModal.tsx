import { useEffect, useState } from 'react';
import { X, Save } from 'lucide-react';
import { Product, supabase } from '../lib/supabase';

interface EditItemModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditItemModal({ product, isOpen, onClose, onSuccess }: EditItemModalProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Books',
    condition: 'Used',
    price: '',
    imageUrl: '',
    sellerName: '',
    sellerPhone: '',
  });

  useEffect(() => {
    if (!product) return;
    setFormData({
      title: product.title,
      description: product.description,
      category: product.category,
      condition: product.condition,
      price: String(product.price),
      imageUrl: product.image_url,
      sellerName: product.seller_name,
      sellerPhone: product.seller_phone,
    });
  }, [product]);

  if (!isOpen || !product) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        condition: formData.condition,
        price: Number(formData.price),
        image_url: formData.imageUrl,
        seller_name: formData.sellerName,
        seller_phone: formData.sellerPhone,
      };

      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', product.id);

      if (error) throw error;
      onSuccess();
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update listing');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="modal-glass rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto animate-slideUp">
        <div className="sticky top-0 modal-glass border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-main">Edit Listing</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--input-bg)] rounded-full transition-colors">
            <X className="w-5 h-5 text-main" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-main mb-2">Title</label>
            <input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 rounded-lg input-surface"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-main mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 rounded-lg input-surface"
              rows={4}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-main mb-2">Category</label>
              <input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 rounded-lg input-surface"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-main mb-2">Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full px-4 py-2 rounded-lg input-surface"
              >
                <option>New</option>
                <option>Used</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-main mb-2">Price</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 rounded-lg input-surface"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-main mb-2">Image URL</label>
              <input
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full px-4 py-2 rounded-lg input-surface"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-main mb-2">Seller Name</label>
              <input
                value={formData.sellerName}
                onChange={(e) => setFormData({ ...formData, sellerName: e.target.value })}
                className="w-full px-4 py-2 rounded-lg input-surface"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-main mb-2">Seller Phone</label>
              <input
                value={formData.sellerPhone}
                onChange={(e) => setFormData({ ...formData, sellerPhone: e.target.value })}
                className="w-full px-4 py-2 rounded-lg input-surface"
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 modal-glass border-t border-[var(--border)] p-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="brand-button text-white px-5 py-2.5 rounded-lg font-semibold disabled:opacity-60 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
