// Renamed file fix
// File Location: client/src/pages/ProductsPage.tsx
// Update for Vercel
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <-- Import hook
import api from '../services/api';
import { Product } from '../types';
import { LuSearch, LuPencil, LuTrash2, LuPlus } from 'react-icons/lu';
import AddProductModal from '../components/products/AddProductModal';
import EditProductModal from '../components/products/EditProductModal'; // No .tsx
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal'; // No .tsx
import toast from 'react-hot-toast';

const ProductsPage = () => {
  const { t } = useTranslation(); // <-- Initialize hook
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // State for delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = () => {
    setLoading(true);
    api.get<Product[]>('/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error("Failed to fetch products", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);
  
  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setProductToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    const toastId = toast.loading(t('notifications.deletingProduct'));

    api.delete(`/products/${productToDelete.id}`)
      .then(() => {
        toast.success(t('notifications.productDeletedSuccess'), { id: toastId });
        fetchProducts();
        closeDeleteModal();
      })
      .catch(err => {
        toast.error(err.response?.data?.msg || t('notifications.productDeleteError'), { id: toastId });
        closeDeleteModal();
      })
      .finally(() => {
        setIsDeleting(false);
      });
  };

  return (
    <>
      <div className="header">
        <h1>{t('productsPage.title')}</h1>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <LuPlus size={18}/> {t('productsPage.addNew')}
        </button>
      </div>
      <div className="table-toolbar">
          <div className="search-container">
              <LuSearch className="search-icon" />
              <input 
                type="text" 
                className="search-input" 
                placeholder={t('productsPage.searchPlaceholder')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
          </div>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{width: '50px'}}>{t('common.id')}</th>
              <th>{t('productsPage.table.name')}</th>
              <th>{t('productsPage.table.brand')}</th>
              <th>{t('productsPage.table.category')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center">{t('productsPage.loading')}</td></tr>
            ) : filteredProducts.map(product => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>
                  <Link to={`/products/${product.id}`} className="link-style">{product.name}</Link>
                </td>
                <td>{product.brand || t('common.notAvailable')}</td>
                <td>{product.category || t('common.notAvailable')}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" onClick={() => openEditModal(product)} title={t('common.edit')}><LuPencil size={18} /></button>
                    <button className="btn-icon btn-icon-danger" onClick={() => openDeleteModal(product)} title={t('common.delete')}>
                      <LuTrash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <AddProductModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={fetchProducts} />
      <EditProductModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSuccess={fetchProducts} product={selectedProduct} />
      
      <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        title={t('modals.deleteProductTitle')}
        message={t('modals.deleteProductMessage', { name: productToDelete?.name })}
        loading={isDeleting}
      />
    </>
  );
};
export default ProductsPage;