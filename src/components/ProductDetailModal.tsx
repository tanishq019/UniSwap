import { X, MessageCircle, Pencil } from 'lucide-react';
import { Product } from '../lib/supabase';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onEdit: (product: Product) => void;
}

export default function ProductDetailModal({ product, onClose, onEdit }: ProductDetailModalProps) {
  if (!product) return null;

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Hi! I'm interested in your ${product.title} listed on UniSwap for \u20B9${product.price}`
    );
    window.open(
      `https://wa.me/${product.seller_phone.replace(/[^0-9]/g, '')}?text=${message}`,
      '_blank'
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="modal-glass rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
        <div className="sticky top-0 modal-glass border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-main">Product Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--input-bg)] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-main" />
          </button>
        </div>

        <div className="p-6">
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-80 object-cover rounded-xl mb-6"
          />

          <div className="flex items-start justify-between mb-4 gap-3">
            <div>
              <h3 className="text-2xl font-bold text-main mb-2">{product.title}</h3>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  product.condition === 'New'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/50'
                    : 'bg-blue-500/15 text-blue-300 border border-blue-500/50'
                }`}
              >
                {product.condition}
              </span>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[var(--brand-strong)]">{'\u20B9'}{product.price}</p>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-semibold text-main mb-2">Description</h4>
            <p className="text-muted leading-relaxed">{product.description}</p>
          </div>

          <div className="mb-6 p-4 surface-soft rounded-lg">
            <h4 className="text-sm font-semibold text-main mb-2">Seller Information</h4>
            <p className="text-main">
              <span className="font-medium">Name:</span> {product.seller_name}
            </p>
            <p className="text-muted text-sm mt-1">
              <span className="font-medium">Category:</span> {product.category}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <button
              onClick={() => onEdit(product)}
              className="w-full ghost-button font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Pencil className="w-5 h-5" />
              Edit Listing
            </button>
            <button
              onClick={handleWhatsApp}
              className="w-full brand-button text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Message on WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
