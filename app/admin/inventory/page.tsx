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
    <main className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-stack-md mb-stack-lg">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface mb-2">Inventory Control</h2>
          <p className="font-body-lg text-secondary">Manage premium stock levels and grooming supplies.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary text-on-primary px-6 py-3 rounded-xl font-label-md shadow-lg shadow-primary/20 hover:brightness-110 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span>
          NEW PRODUCT
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-section-gap">
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30">
          <span className="text-outline font-label-sm uppercase tracking-wider">Total Value</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-headline-lg font-bold text-on-surface">₹{stats.totalValue.toLocaleString()}</span>
            <span className="text-primary text-label-sm font-bold">In Stock</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30">
          <span className="text-outline font-label-sm uppercase tracking-wider">Low Stock Alerts</span>
          <div className="mt-2 flex items-center gap-3">
            <span className={`text-headline-lg font-bold ${stats.lowStockCount > 0 ? 'text-error' : 'text-on-surface'}`}>
              {stats.lowStockCount.toString().padStart(2, '0')}
            </span>
            {stats.lowStockCount > 0 && <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>}
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30">
          <span className="text-outline font-label-sm uppercase tracking-wider">Top Category</span>
          <div className="mt-2">
            <span className="text-headline-md font-bold text-on-surface">{stats.topCatName}</span>
          </div>
        </div>
      </div>

      {/* Product Categories */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="space-y-section-gap pb-section-gap">
          {Object.entries(productsByCategory).map(([category, items]) => (
            <section key={category}>
              <div className="flex items-center justify-between mb-stack-lg border-b border-outline-variant/20 pb-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">
                    {category === 'Tools' ? 'construction' : category === 'Shaving Supplies' ? 'content_cut' : 'spa'}
                  </span>
                  <h3 className="font-headline-md text-on-surface font-bold">{category}</h3>
                  <span className="bg-surface-container-high px-3 py-0.5 rounded-full text-[10px] font-bold text-outline uppercase">
                    {items.length} {items.length === 1 ? 'Item' : 'Items'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
                {items.map((product) => (
                  <div key={product.id} className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm group hover:shadow-md transition-all border border-outline-variant/10">
                    <div className="aspect-square rounded-xl bg-surface-container mb-4 overflow-hidden relative">
                      {product.stockQuantity < 10 && (
                        <div className="absolute top-2 left-2 bg-error text-on-error text-[10px] font-bold px-2 py-1 rounded-lg z-10">
                          LOW STOCK
                        </div>
                      )}
                      {product.imageUrl ? (
                        <div className="relative w-full h-full">
                          <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={product.imageUrl} alt={product.name} />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-outline">
                          <span className="material-symbols-outlined text-4xl">inventory_2</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={() => handleOpenModal(product)} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="w-10 h-10 rounded-full bg-error text-white flex items-center justify-center hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </div>
                    <h4 className="font-label-md text-on-surface font-bold">{product.name}</h4>
                    <p className="text-[10px] text-outline uppercase font-bold tracking-wider mb-3 truncate">{product.description || 'No description'}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-outline font-bold uppercase">Price</span>
                        <div className="font-bold text-on-surface">₹{product.price.toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-outline font-bold uppercase">Stock</span>
                        <div className={`font-bold ${product.stockQuantity < 10 ? 'text-error' : 'text-primary'}`}>
                          {product.stockQuantity} <span className="text-[10px] font-normal text-outline">Units</span>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/30">
            <div className="px-8 py-6 border-b border-outline-variant/20 flex justify-between items-center">
              <h3 className="text-xl font-bold text-on-surface uppercase tracking-widest">
                {editingProduct ? 'Edit Product' : 'New Product'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-2">Product Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-2">Price (₹)</label>
                  <input
                    required
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-2">Stock Level</label>
                  <input
                    required
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-2">Image URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface"
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 rounded-xl bg-surface-container-high text-on-surface font-bold uppercase tracking-wider hover:bg-surface-container-highest transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl bg-primary text-on-primary font-bold uppercase tracking-wider shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
                >
                  {editingProduct ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
