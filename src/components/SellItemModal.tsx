import { X, ArrowRight, ArrowLeft, Check, Upload, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

interface SellItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const categories = [
  'Books',
  'Electronics',
  'Lab Gear',
  'Cycles',
  'Engineering Drawing',
  'Miscellaneous',
];

const countryCodes = ['+91', '+1', '+44', '+61', '+81'];

const descriptionSuggestions: Record<string, string> = {
  Books: 'Includes highlighted chapters, no torn pages, and ready for immediate use in current semester.',
  Electronics: 'Fully functional with charger/accessories included. Battery and ports tested recently.',
  'Lab Gear': 'Maintained equipment with no leaks or cracks. Suitable for practical sessions and projects.',
  Cycles: 'Smooth brakes and gears, recently serviced, ideal for campus commute with low maintenance.',
  'Engineering Drawing': 'Complete set with clean sheets and tools, lightly used and exam-ready condition.',
  Miscellaneous: 'Useful campus item in reliable condition. Can be inspected before purchase.',
};

const normalizePhone = (countryCode: string, rawPhone: string) => {
  const trimmed = rawPhone.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('+')) {
    return `+${trimmed.replace(/\D/g, '')}`;
  }

  const digits = trimmed.replace(/\D/g, '').replace(/^0+/, '');
  const code = countryCode.replace('+', '');

  if (digits.startsWith(code)) {
    return `+${digits}`;
  }

  return `${countryCode}${digits}`;
};

export default function SellItemModal({ isOpen, onClose, onSuccess }: SellItemModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [countryCode, setCountryCode] = useState('+91');
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

  const activeSuggestion = useMemo(
    () => descriptionSuggestions[formData.category] || descriptionSuggestions.Miscellaneous,
    [formData.category]
  );

  if (!isOpen) return null;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please choose a valid image file.');
      return;
    }

    setImageFile(file);
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let imageUrl = formData.imageUrl.trim();

      if (imageFile) {
        const extension = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, imageFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: imageFile.type,
          });

        if (uploadError) {
          throw new Error(
            `${uploadError.message}. Create a public bucket named "product-images" in Supabase Storage.`
          );
        }

        const { data: publicData } = supabase.storage.from('product-images').getPublicUrl(fileName);
        imageUrl = publicData.publicUrl;
      }

      const sellerPhone = normalizePhone(countryCode, formData.sellerPhone);

      const { error } = await supabase.from('products').insert([
        {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          condition: formData.condition,
          price: parseFloat(formData.price),
          image_url: imageUrl || '',
          seller_name: formData.sellerName,
          seller_phone: sellerPhone,
        },
      ]);

      if (error) throw error;

      setFormData({
        title: '',
        description: '',
        category: 'Books',
        condition: 'Used',
        price: '',
        imageUrl: '',
        sellerName: '',
        sellerPhone: '',
      });
      setImageFile(null);
      setCountryCode('+91');
      setStep(1);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating product:', error);
      alert(error instanceof Error ? error.message : 'Failed to create product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceedStep1 = formData.title && formData.description && formData.category;
  const canProceedStep2 = formData.price && formData.condition;
  const canProceedStep3 = formData.sellerName && formData.sellerPhone;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="modal-glass rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
        <div className="sticky top-0 modal-glass border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-main">List Your Item</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--input-bg)] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-main" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    step >= s ? 'brand-button text-white border-transparent' : 'ghost-button text-muted'
                  }`}
                >
                  {step > s ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > s ? 'bg-[var(--brand)]' : 'bg-[var(--border)]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted">
            <span>Details</span>
            <span>Price & Image</span>
            <span>Contact</span>
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-main mb-2">
                  Item Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Scientific Calculator Casio FX-991EX"
                  className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)] input-surface"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-main mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value,
                      description: prev.description || descriptionSuggestions[e.target.value],
                    }))
                  }
                  className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)] input-surface"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-lg border border-indigo-500/25 bg-indigo-500/10 p-3">
                <p className="text-xs uppercase tracking-wide text-[var(--brand-strong)] mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Suggested Description
                </p>
                <p className="text-sm text-main">{activeSuggestion}</p>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, description: activeSuggestion }))}
                  className="mt-2 text-sm text-[var(--brand-strong)] hover:brightness-110"
                >
                  Use this suggestion
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-main mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your item and important details..."
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)] input-surface"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-main mb-2">
                  Price ({'\u20B9'})
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="e.g., 1200"
                  className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)] input-surface"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-main mb-2">
                  Condition
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="New"
                      checked={formData.condition === 'New'}
                      onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                      className="mr-2"
                    />
                    <span className="text-main">New</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="Used"
                      checked={formData.condition === 'Used'}
                      onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                      className="mr-2"
                    />
                    <span className="text-main">Used</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-main mb-2">
                  Product Image (optional)
                </label>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => {
                      setFormData({ ...formData, imageUrl: e.target.value });
                      if (e.target.value) setImageFile(null);
                    }}
                    placeholder="Paste image URL"
                    className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)] input-surface"
                  />
                  <label className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-dashed border-[var(--brand-strong)] text-[var(--brand-strong)] hover:bg-[var(--input-bg)] cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-muted mt-2">
                  Supports JPEG/PNG/web images. If both are empty, a gradient placeholder will be shown.
                </p>
                {imageFile && (
                  <p className="text-xs text-emerald-400 mt-1">
                    Selected: {imageFile.name}
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-main mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={formData.sellerName}
                  onChange={(e) => setFormData({ ...formData, sellerName: e.target.value })}
                  placeholder="e.g., Rahul Kumar"
                  className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)] input-surface"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-main mb-2">
                  WhatsApp Number
                </label>
                <div className="grid grid-cols-[110px,1fr] gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)] input-surface"
                  >
                    {countryCodes.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={formData.sellerPhone}
                    onChange={(e) => setFormData({ ...formData, sellerPhone: e.target.value })}
                    onBlur={() =>
                      setFormData((prev) => ({
                        ...prev,
                        sellerPhone: normalizePhone(countryCode, prev.sellerPhone),
                      }))
                    }
                    placeholder="9876543210"
                    className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)] input-surface"
                  />
                </div>
                <p className="text-xs text-muted mt-1">
                  Country code is auto-added if the number does not start with +.
                </p>
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4">
                <p className="text-sm text-main">
                  <strong>Note:</strong> Buyers will contact you via WhatsApp. Make sure your number is correct.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 modal-glass border-t px-6 py-4 flex justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 px-4 py-2 text-main hover:bg-[var(--input-bg)] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)}
              className="flex items-center gap-2 px-6 py-2 brand-button text-white rounded-lg disabled:opacity-55 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceedStep3 || loading}
              className="flex items-center gap-2 px-6 py-2 brand-button text-white rounded-lg disabled:opacity-55 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Publishing...' : 'Publish product'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
