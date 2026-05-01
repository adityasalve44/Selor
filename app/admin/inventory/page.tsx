'use client';

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/app/components/Toast';
import { SkeletonCard } from '@/app/components/Skeleton';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import type { ProductDto } from '@/types/domain';

export default function InventoryPage() {
  return (
    <ErrorBoundary>
      <InventoryContent />
    </ErrorBoundary>
  );
}

function InventoryContent() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stockQuantity: 0,
    category: 'Hair Products',
    imageUrl: '',
  });

  const categories = ['Hair Products', 'Shaving Supplies', 'Tools', 'Grooming Kits'];

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data);
    } catch (_err) {
      setError(_err instanceof Error ? _err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const totalValue = products.reduce((acc, p) => acc + (p.price * p.stockQuantity), 0);
    const lowStockCount = products.filter(p => p.stockQuantity < 10).length;
    const topCategory = products.reduce((acc, p) => {
      const cat = p.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topCatName = Object.entries(topCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
    
    return { totalValue, lowStockCount, topCatName };
  }, [products]);

  const productsByCategory = useMemo(() => {
    return products.reduce((acc, p) => {
      const cat = p.category || 'Uncategorized';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
      return acc;
    }, {} as Record<string, ProductDto[]>);
  }, [products]);

  const handleOpenModal = (product?: ProductDto) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        stockQuantity: product.stockQuantity,
        category: product.category || 'Hair Products',
        imageUrl: product.imageUrl || '',
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        stockQuantity: 0,
        category: 'Hair Products',
        imageUrl: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingProduct ? 'PATCH' : 'POST';
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Operation failed');
      
      toast.success(editingProduct ? 'Product updated' : 'Product created');
      setIsModalOpen(false);
      fetchProducts();
    } catch (_err) {
      toast.error('Error saving product');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Product deleted');
      fetchProducts();
    } catch (_err) {
      toast.error('Error deleting product');
    }
  };

  if (error) {
    return (
      <div className="p-margin-desktop text-center">
        <p className="text-error font-headline-sm">{error}</p>
        <button onClick={fetchProducts} className="mt-4 text-primary font-label-md">Retry</button>
      </div>
    );
  }

  return (
    <main className="px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto min-h-screen pb-24">
      {/* Header */}
      <section className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-10 mt-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
             <span className="font-label-md text-on-surface-variant uppercase tracking-[0.3em] text-[10px] opacity-40">Resource Distribution</span>
          </div>
          <h2 className="font-display-lg text-display-lg text-on-surface tracking-tighter lowercase">inventory <span className="text-primary">matrix</span></h2>
          <p className="text-[10px] font-label-md text-on-surface-variant uppercase tracking-[0.2em] opacity-40">Managing {products.length} registered assets</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-10 py-5 bg-primary text-on-primary rounded-md shadow-technical font-label-md uppercase tracking-[0.2em] text-[11px] hover:opacity-90 transition-all flex items-center gap-3 active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          initialize new asset
        </button>
      </section>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
        <div className="bg-surface-container-low p-12 rounded-lg shadow-technical border border-white/5 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full group-hover:scale-110 transition-transform duration-700"></div>
           <div className="flex items-center gap-3 mb-10">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span className="text-on-surface-variant font-label-md uppercase tracking-[0.3em] text-[10px] opacity-40">Capital Valuation</span>
           </div>
          <div className="flex items-baseline gap-4">
            <span className="text-5xl font-display-lg tracking-tighter text-on-surface">₹{stats.totalValue.toLocaleString()}</span>
            <span className="text-primary text-[10px] font-bold uppercase tracking-widest opacity-60">Manifested</span>
          </div>
        </div>
        <div className="bg-surface-container-low p-12 rounded-lg shadow-technical border border-white/5 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-error/5 rounded-bl-full group-hover:scale-110 transition-transform duration-700"></div>
           <div className="flex items-center gap-3 mb-10">
              <span className="w-1.5 h-1.5 bg-error rounded-full"></span>
              <span className="text-on-surface-variant font-label-md uppercase tracking-[0.3em] text-[10px] opacity-40">Critical Depletion</span>
           </div>
          <div className="flex items-center gap-5">
            <span className={`text-5xl font-display-lg tracking-tighter ${stats.lowStockCount > 0 ? 'text-error' : 'text-on-surface'}`}>
              {stats.lowStockCount.toString().padStart(2, '0')}
            </span>
            {stats.lowStockCount > 0 && <span className="material-symbols-outlined text-error animate-pulse text-[32px]">warning</span>}
          </div>
        </div>
        <div className="bg-surface-container-low p-12 rounded-lg shadow-technical border border-white/5 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full group-hover:scale-110 transition-transform duration-700"></div>
           <div className="flex items-center gap-3 mb-10">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span className="text-on-surface-variant font-label-md uppercase tracking-[0.3em] text-[10px] opacity-40">Dominant Sector</span>
           </div>
          <div>
            <span className="text-3xl font-display-lg tracking-tighter text-on-surface lowercase">{stats.topCatName}</span>
          </div>
        </div>
      </div>

      {/* Product Categories */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="space-y-24 pb-24">
          {Object.entries(productsByCategory).map(([category, items]) => (
            <section key={category}>
              <div className="flex items-center justify-between mb-12 border-b border-outline-variant/10 pb-8">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-md bg-surface-container-high flex items-center justify-center text-primary shadow-inner">
                    <span className="material-symbols-outlined text-[22px]">
                      {category === 'Tools' ? 'architecture' : category === 'Shaving Supplies' ? 'content_cut' : 'spa'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-display-lg text-3xl text-on-surface lowercase tracking-tighter">{category}</h3>
                    <p className="text-[9px] font-label-md text-on-surface-variant uppercase tracking-[0.3em] opacity-40">Sector Registry: {items.length} units manifested</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
                {items.map((product) => (
                  <div key={product.id} className="bg-surface-container-low rounded-lg p-8 shadow-technical group transition-all duration-500 border border-white/5 relative overflow-hidden flex flex-col">
                    <div className="aspect-[4/5] rounded-sm bg-surface-container-high mb-8 overflow-hidden relative shadow-inner">
                      {product.stockQuantity < 10 && (
                        <div className="absolute top-6 left-6 bg-error text-on-error text-[8px] font-bold px-4 py-2 rounded-sm z-10 uppercase tracking-[0.2em] shadow-technical">
                          Depleted
                        </div>
                      )}
                      {product.imageUrl ? (
                        <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0" src={product.imageUrl} alt={product.name} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary/10">
                          <span className="material-symbols-outlined text-[72px]">inventory_2</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 backdrop-blur-sm flex items-center justify-center gap-6">
                        <button onClick={() => handleOpenModal(product)} className="w-14 h-14 rounded-sm bg-white text-on-surface flex items-center justify-center shadow-technical hover:scale-110 active:scale-90 transition-all">
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="w-14 h-14 rounded-sm bg-error text-white flex items-center justify-center shadow-technical hover:scale-110 active:scale-90 transition-all">
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 mb-10">
                      <h4 className="font-display-lg text-2xl text-on-surface lowercase tracking-tighter leading-tight group-hover:text-primary transition-colors">{product.name}</h4>
                      <p className="text-[10px] font-label-md text-on-surface-variant uppercase tracking-[0.2em] opacity-40 leading-relaxed">{product.description || 'null specification'}</p>
                    </div>
                    <div className="flex items-center justify-between pt-8 border-t border-outline-variant/10 mt-auto">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-on-surface-variant font-label-md uppercase tracking-[0.3em] opacity-20">Valuation</span>
                        <div className="font-display-lg text-xl text-on-surface tracking-tighter">₹{product.price.toFixed(0)}</div>
                      </div>
                      <div className="text-right flex flex-col gap-1">
                        <span className="text-[9px] text-on-surface-variant font-label-md uppercase tracking-[0.3em] opacity-20">Registry</span>
                        <div className={`font-display-lg text-xl tracking-tighter ${product.stockQuantity < 10 ? 'text-error' : 'text-primary'}`}>
                          {product.stockQuantity}<span className="text-[10px] ml-1 opacity-40">units</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/80">
          <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-surface-container-low rounded-lg shadow-technical overflow-hidden border border-white/5 animate-in fade-in zoom-in duration-300">
            <div className="px-10 py-10 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-high/20">
              <div className="space-y-1">
                 <div className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    <span className="text-[9px] font-label-md text-on-surface-variant uppercase tracking-[0.3em] opacity-40">Asset Registry</span>
                 </div>
                 <h3 className="font-display-lg text-3xl text-on-surface lowercase tracking-tighter">
                   {editingProduct ? 'update asset manifest' : 'initialize stock item'}
                 </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-full text-on-surface-variant opacity-40 hover:opacity-100 transition-all hover:bg-surface-container-high">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-10">
              <div className="grid grid-cols-2 gap-10">
                <div className="col-span-2 space-y-3">
                  <label className="block text-[10px] font-label-md text-on-surface-variant uppercase tracking-[0.3em] opacity-40">Nomenclature</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-6 py-5 rounded-md bg-surface-container-high border-none text-on-surface font-display-lg text-2xl focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/20 shadow-inner"
                    placeholder="Asset designation"
                  />
                </div>
                <div className="col-span-2 space-y-3">
                  <label className="block text-[10px] font-label-md text-on-surface-variant uppercase tracking-[0.3em] opacity-40">Technical Specifications</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-6 py-5 rounded-md bg-surface-container-high border-none text-on-surface font-body-md focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/20 shadow-inner resize-none"
                    placeholder="Operational parameters and definition..."
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-label-md text-on-surface-variant uppercase tracking-[0.3em] opacity-40">Valuation (₹)</label>
                  <input
                    required
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-6 py-5 rounded-md bg-surface-container-high border-none text-on-surface font-display-lg text-2xl shadow-inner"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-label-md text-on-surface-variant uppercase tracking-[0.3em] opacity-40">Unit Quantization</label>
                  <input
                    required
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                    className="w-full px-6 py-5 rounded-md bg-surface-container-high border-none text-on-surface font-display-lg text-2xl shadow-inner"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-label-md text-on-surface-variant uppercase tracking-[0.3em] opacity-40">Sector Classification</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-6 py-5 rounded-md bg-surface-container-high border-none text-on-surface font-label-md uppercase tracking-[0.15em] text-[11px] shadow-inner appearance-none cursor-pointer"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-label-md text-on-surface-variant uppercase tracking-[0.3em] opacity-40">Visual Manifest (URL)</label>
                  <input
                    type="text"
                    placeholder="https://resource.host/image.png"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-6 py-5 rounded-md bg-surface-container-high border-none text-on-surface font-label-md text-[11px] shadow-inner"
                  />
                </div>
              </div>
              <div className="pt-10 flex gap-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-6 font-label-md text-on-surface-variant uppercase tracking-[0.3em] text-[10px] opacity-40 hover:opacity-100 transition-all hover:bg-surface-container-high rounded-md"
                >
                  Abort Operation
                </button>
                <button
                  type="submit"
                  className="flex-2 py-6 bg-primary text-on-primary rounded-md font-label-md uppercase tracking-[0.3em] text-[11px] shadow-technical hover:opacity-90 transition-all active:scale-[0.98]"
                >
                  {editingProduct ? 'Commit Manifest Changes' : 'Execute Asset Initialization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
