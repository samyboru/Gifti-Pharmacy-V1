// File Location: client/src/pages/ProductDetailsPage.tsx

import { useState, useEffect, JSX, useCallback, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { ProductDetails, InventoryItem } from '../types';
import { LuArrowLeft, LuPlus, LuTrash2, LuSearch } from 'react-icons/lu';
import AddStockModal from '../components/inventory/AddStockModal.tsx';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/currency';

const ProductDetailsPage = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  
  // --- THIS IS THE KEY FIX ---
  // Initialize the search term state ONLY ONCE from the URL parameter.
  const [batchSearchTerm, setBatchSearchTerm] = useState(() => searchParams.get('batch') || '');

  // This separate useEffect ensures that if the user navigates between
  // product pages that have a batch filter, the state is correctly updated.
  useEffect(() => {
    setBatchSearchTerm(searchParams.get('batch') || '');
  }, [searchParams]);

  const fetchProductDetails = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get<ProductDetails>(`/products/${id}/details`)
      .then(res => setProduct(res.data))
      .catch(err => {
        console.error("Failed to fetch product details", err);
        const backendMsg = err.response?.data?.msg;
        toast.error(backendMsg || 'Failed to fetch product details.');
        if (err.response?.status === 404) {
            setError("The product you are looking for could not be found.");
        } else {
            setError("An unexpected error occurred while fetching product details.");
        }
        setProduct(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchProductDetails();
    }
  }, [id, fetchProductDetails]);
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const filteredBatches = useMemo(() => {
      if (!product) return [];
      if (!batchSearchTerm) return product.inventoryBatches;
      if (batchSearchTerm.toUpperCase() === 'N/A' || batchSearchTerm === '') {
          return product.inventoryBatches.filter(batch => !batch.batch_number);
      }
      return product.inventoryBatches.filter(batch => 
          batch.batch_number?.toLowerCase().includes(batchSearchTerm.toLowerCase())
      );
  }, [product, batchSearchTerm]);
  
  if (loading) {
    return <p className="text-center">Loading product details...</p>;
  }

  if (error) {
    return (
        <div className="text-center placeholder-text" style={{ padding: '2rem' }}>
            <h1>Product Not Found</h1>
            <p>{error}</p>
            <Link to="/inventory" className="btn btn-primary" style={{marginTop: '1rem'}}>
                <LuArrowLeft /> Back to Inventory
            </Link>
        </div>
    );
  }

  if (!product) {
    return <p className="text-center">Product data is unavailable.</p>;
  }

  return (
    <>
      <div className="header">
        <div className="header-info" style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/inventory" className="btn btn-secondary btn-icon" style={{marginRight: '1rem'}}>
            <LuArrowLeft />
          </Link>
          <h1>{product.name}</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddStockModalOpen(true)}>
          <LuPlus size={18} /> Add Stock
        </button>
      </div>

      <div className="user-card" style={{ marginBottom: '1.5rem' }}>
        <div className="user-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
            <p><strong>Brand:</strong> {product.brand || 'N/A'}</p>
            <p><strong>Category:</strong> {product.category || 'N/A'}</p>
            <p><strong>Requires Prescription:</strong> {product.requires_prescription ? 'Yes' : 'No'}</p>
        </div>
      </div>
      
      <div className="table-container">
        <div className="table-toolbar">
          <h2>Inventory Batches</h2>
          <div className="search-container" style={{ maxWidth: '300px' }}>
            <LuSearch className="search-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Filter by Batch #" 
              value={batchSearchTerm}
              onChange={(e) => setBatchSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Batch #</th>
              <th>Stock (Packages)</th>
              <th>Selling Price</th>
              <th>Expiry Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBatches.length > 0 ? (
              filteredBatches.map((batch: InventoryItem) => (
                <tr key={batch.id}>
                  <td>{batch.batch_number || 'N/A'}</td>
                  <td>{batch.quantity_of_packages}</td>
                  <td>{formatCurrency(Number(batch.selling_price))}</td>
                  <td>{formatDate(batch.expiry_date)}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon btn-icon-danger" title="Delete Batch"><LuTrash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="text-center">
                {batchSearchTerm ? 'No batches match your filter.' : 'No stock for this product in inventory.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AddStockModal 
        isOpen={isAddStockModalOpen} 
        onClose={() => setIsAddStockModalOpen(false)} 
        onSuccess={fetchProductDetails} 
      />
    </>
  );
};

export default ProductDetailsPage;