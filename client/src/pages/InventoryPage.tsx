// File Location: client/src/pages/InventoryPage.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { 
  LuPlus, 
  LuSearch, 
  LuPencil, 
  LuBox, 
  LuTrash2, 
  LuTriangle, 
  LuCalendarClock, 
  LuChevronDown, 
  LuChevronRight, 
  LuFilterX 
} from 'react-icons/lu';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { InventoryItem, Product } from '../types';
import { formatCurrency } from '../utils/currency';
import { formatDate, getDaysUntilExpiry } from '../utils/date';

// --- IMPORT CONTEXT ---
import { useNotifications } from '../context/NotificationContext';

// Components
import AddStockModal from '../components/inventory/AddStockModal';
import AdjustStockModal from '../components/inventory/AdjustStockModal';
import UpdatePricesModal from '../components/inventory/UpdatePricesModal'; 
import ConfirmActionModal from '../components/common/ConfirmDeleteModal';

const InventoryPage = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // --- GET REFRESH TRIGGER ---
    const { refreshUnreadCount } = useNotifications();

    // Initialize search from URL if present
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // State to track expanded product rows (Array of IDs)
    const [expandedProducts, setExpandedProducts] = useState<number[]>([]);
    
    // Modals State
    const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
    const [isAdjustStockModalOpen, setIsAdjustStockModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isUpdatePricesModalOpen, setIsUpdatePricesModalOpen] = useState(false); 
    
    // Selected Item State
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [selectedProductForUpdate, setSelectedProductForUpdate] = useState<Product | null>(null);
    const [batchesForUpdate, setBatchesForUpdate] = useState<InventoryItem[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);

    // Get status filter from URL
    const filterStatus = searchParams.get('status');

    // Listen for URL changes to update search input
    useEffect(() => {
        const urlSearch = searchParams.get('search');
        if (urlSearch) {
            setSearchQuery(urlSearch);
        }
    }, [searchParams]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/inventory');
            setInventoryItems(response.data);
        } catch (err) {
            setError('Failed to fetch inventory data.');
            toast.error('Failed to fetch inventory data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Toggle expansion logic
    const toggleProduct = (productId: number) => {
        setExpandedProducts(prev => 
            prev.includes(productId) 
                ? prev.filter(id => id !== productId) 
                : [...prev, productId]
        );
    };

    // --- FILTERING & GROUPING LOGIC ---
    const groupedAndFilteredItems = useMemo(() => {
        const filtered = inventoryItems.filter(item => {
            // 1. Text Search
            const matchesSearch = 
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.batch_number && item.batch_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.supplier_name && item.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()));

            // 2. Status Filter
            let matchesStatus = true;
            if (filterStatus) {
                const days = getDaysUntilExpiry(item.expiry_date);
                switch (filterStatus) {
                    case 'expired':
                        matchesStatus = days < 0;
                        break;
                    case 'expiring_soon':
                        matchesStatus = days >= 0 && days <= 30;
                        break;
                    case 'low_stock':
                        matchesStatus = item.quantity_of_packages > 0 && item.quantity_of_packages <= 10;
                        break;
                    case 'out_of_stock':
                        matchesStatus = item.quantity_of_packages === 0;
                        break;
                    default:
                        matchesStatus = true;
                }
            }
            return matchesSearch && matchesStatus;
        });

        // Group by Product ID
        return filtered.reduce((acc, item) => {
            (acc[item.product_id] = acc[item.product_id] || []).push(item);
            return acc;
        }, {} as { [key: number]: InventoryItem[] });

    }, [inventoryItems, searchQuery, filterStatus]);

    // --- AUTO EXPAND ---
    useEffect(() => {
        if ((filterStatus || searchQuery) && Object.keys(groupedAndFilteredItems).length > 0) {
            const allProductIds = Object.keys(groupedAndFilteredItems).map(Number);
            setExpandedProducts(allProductIds);
        }
    }, [filterStatus, searchQuery, groupedAndFilteredItems]);

    const clearFilter = () => {
        setSearchParams({}); // Clear URL params
        setSearchQuery('');
        setExpandedProducts([]); // Collapse all
    };

    // --- ACTION HANDLERS ---

    const handleSuccess = async () => {
        await fetchData(); // Reload Table
        await refreshUnreadCount(); // Refresh Notification Badge immediately
    };

    const handleDeleteItem = async () => {
        if (!selectedItem) return;
        setIsDeleting(true);
        try {
            await api.delete(`/inventory/${selectedItem.id}`);
            toast.success('Inventory item deleted.');
            
            await fetchData(); // Reload Table
            await refreshUnreadCount(); // Refresh Notification Badge immediately
            
            setIsDeleteModalOpen(false);
            setSelectedItem(null);
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Failed to delete item.');
        } finally {
            setIsDeleting(false);
        }
    };

    // Modal Openers
    const handleOpenAdjustModal = (item: InventoryItem) => {
        setSelectedItem(item);
        setIsAdjustStockModalOpen(true);
    };

    const handleOpenDeleteModal = (item: InventoryItem) => {
        setSelectedItem(item);
        setIsDeleteModalOpen(true);
    };
    
    const handleOpenUpdatePricesModal = (productGroup: InventoryItem[]) => {
        if (!productGroup || productGroup.length === 0) return;
        const mainProduct = productGroup[0];
        
        const product: Product = {
            id: mainProduct.product_id,
            name: mainProduct.name,
            brand: mainProduct.brand || null,
            requires_prescription: mainProduct.requires_prescription,
            category: null, description: null, suppliers: [], 
        };
        
        setSelectedProductForUpdate(product);
        setBatchesForUpdate(productGroup);
        setIsUpdatePricesModalOpen(true);
    };

    if (loading) return <p>{t('common.loading', 'Loading...')}</p>;
    if (error) return <p style={{ color: 'var(--danger-color)' }}>{error}</p>;

    return (
        <>
            {/* --- MODALS --- */}
            <AddStockModal isOpen={isAddStockModalOpen} onClose={() => setIsAddStockModalOpen(false)} onSuccess={handleSuccess} />
            <AdjustStockModal isOpen={isAdjustStockModalOpen} onClose={() => { setIsAdjustStockModalOpen(false); setSelectedItem(null); }} onSuccess={handleSuccess} item={selectedItem} />
            <UpdatePricesModal isOpen={isUpdatePricesModalOpen} onClose={() => setIsUpdatePricesModalOpen(false)} onSuccess={handleSuccess} product={selectedProductForUpdate} batches={batchesForUpdate} />
            <ConfirmActionModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteItem} title="Delete Inventory Item" message={`Are you sure you want to delete the batch "${selectedItem?.batch_number || selectedItem?.name}"? This cannot be undone.`} loading={isDeleting}/>
            
            {/* --- HEADER --- */}
            <div className="header">
                <h1>{t('inventoryPage.title', 'Inventory Management')}</h1>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={() => setIsAddStockModalOpen(true)}><LuPlus /><span>{t('inventoryPage.addStock', 'Add Stock')}</span></button>
                </div>
            </div>
            
            {/* --- TABLE TOOLBAR --- */}
            <div className="inventory-table-container">
                <div className="table-toolbar" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                     <div className="search-container" style={{ flex: 1 }}>
                        <span className="search-icon"><LuSearch /></span>
                        <input 
                            type="text" 
                            className="search-input" 
                            placeholder={t('inventoryPage.searchPlaceholder', 'Search by name, brand, or batch...')} 
                            value={searchQuery} 
                            onChange={e => {
                                setSearchQuery(e.target.value);
                                if(e.target.value === '') {
                                    const newParams = new URLSearchParams(searchParams);
                                    newParams.delete('search');
                                    setSearchParams(newParams);
                                }
                            }} 
                        />
                    </div>

                    {/* Active Filter Badge */}
                    {(filterStatus || searchQuery) && (
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem', 
                            background: 'var(--bg-secondary)', 
                            border: '1px solid var(--border-color)',
                            padding: '0.5rem 1rem', 
                            borderRadius: '8px' 
                        }}>
                            <span style={{ color: 'var(--primary-color)', fontWeight: 'bold', textTransform: 'capitalize' }}>
                                {filterStatus ? `Filter: ${filterStatus.replace('_', ' ')}` : 'Active Search'}
                            </span>
                            <button 
                                onClick={clearFilter} 
                                style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    color: 'var(--text-secondary)', 
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center' 
                                }}
                            >
                                <LuFilterX title="Clear Filter" />
                            </button>
                        </div>
                    )}
                </div>

                {/* --- DATA TABLE --- */}
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}></th>
                                <th className="col-product">{t('inventoryPage.table.productName', 'Product Name')}</th>
                                <th className="col-stock">{t('inventoryPage.table.quantity', 'Stock')}</th>
                                <th className="col-price">{t('inventoryPage.table.price', 'Price')}</th>
                                <th className="col-expiry">{t('inventoryPage.table.expiry', 'Expiry Date')}</th>
                                <th className="col-batch">{t('inventoryPage.table.batch', 'Batch No.')}</th>
                                <th className="col-supplier">{t('inventoryPage.table.supplier', 'Supplier')}</th>
                                <th className="col-actions">{t('inventoryPage.table.actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(groupedAndFilteredItems).length > 0 ? (
                                Object.values(groupedAndFilteredItems).map(productGroup => {
                                    const mainProduct = productGroup[0];
                                    const totalStock = productGroup.reduce((sum, item) => sum + item.quantity_of_packages, 0);
                                    const isExpanded = expandedProducts.includes(mainProduct.product_id);
                                    
                                    return (
                                        <React.Fragment key={mainProduct.product_id}>
                                            {/* Product Parent Row */}
                                            <tr className="product-group-row clickable" onClick={() => toggleProduct(mainProduct.product_id)}>
                                                <td>{isExpanded ? <LuChevronDown /> : <LuChevronRight />}</td>
                                                <td className="col-product">
                                                    {mainProduct.name}
                                                    <br/>
                                                    <small className="sub-text">{mainProduct.brand}</small>
                                                </td>
                                                <td className="col-stock">{totalStock}</td>
                                                <td colSpan={5} className="col-actions" style={{ textAlign: 'right', paddingRight: '1rem' }}>
                                                    <button 
                                                        className="btn btn-secondary" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenUpdatePricesModal(productGroup);
                                                        }}
                                                    >
                                                        <LuPencil size={14} /> 
                                                        <span style={{ marginLeft: '0.5rem' }}>Update Prices</span>
                                                    </button>
                                                </td>
                                            </tr>
                                            
                                            {/* Batch Child Rows */}
                                            {isExpanded && productGroup.map(item => {
                                                const daysUntilExpiry = getDaysUntilExpiry(item.expiry_date);
                                                const isLowStock = item.quantity_of_packages > 0 && item.quantity_of_packages <= 10;
                                                const isExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
                                                const isExpired = daysUntilExpiry < 0;
                                                
                                                return (
                                                    <tr key={item.id} className="batch-row">
                                                        <td></td>
                                                        <td className="col-product"></td>
                                                        <td className="col-stock">
                                                            <div className="stock-cell">
                                                                <LuBox size={14} /> {item.quantity_of_packages}
                                                                {isLowStock && <span className="status-badge status-warning">Low</span>}
                                                                {item.quantity_of_packages === 0 && <span className="status-badge status-danger">Out</span>}
                                                            </div>
                                                        </td>
                                                        <td className="col-price">{formatCurrency(parseFloat(item.selling_price))}</td>
                                                        <td className="col-expiry">
                                                            <div className="expiry-cell">
                                                                {formatDate(item.expiry_date)}
                                                                {isExpired && <span className="expiry-warning-indicator expired"><LuTriangle size={12} /> Expired</span>}
                                                                {isExpiringSoon && !isExpired && <span className="expiry-warning-indicator"><LuCalendarClock size={12} /> {daysUntilExpiry}d</span>}
                                                            </div>
                                                        </td>
                                                        <td className="col-batch">{item.batch_number || 'N/A'}</td>
                                                        <td className="col-supplier">{item.supplier_name || 'N/A'}</td>
                                                        <td className="col-actions">
                                                            <div className="action-buttons">
                                                                <button className="btn-icon" title="Edit / Adjust Stock" onClick={() => handleOpenAdjustModal(item)}><LuPencil /></button>
                                                                <button className="btn-icon btn-icon-danger" title="Delete Batch" onClick={() => handleOpenDeleteModal(item)}><LuTrash2 /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </React.Fragment>
                                    );
                                })
                            ) : (
                                <tr><td colSpan={8} className="text-center">{t('inventoryPage.noItems', 'No inventory items found matching your filters.')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default InventoryPage;