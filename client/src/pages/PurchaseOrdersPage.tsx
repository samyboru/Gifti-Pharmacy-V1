// File Location: client/src/pages/PurchaseOrdersPage.tsx
import { useState, useEffect, JSX } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../services/api';
import { PurchaseOrder, User } from '../types';
import { useAuth } from '../context/AuthContext';
import AddPOModal, { POToEdit } from '../components/purchaseOrders/AddPOModal.tsx';
import ReceivePOModal from '../components/purchaseOrders/ReceivePOModal.tsx';
import PODetailsModal from '../components/purchaseOrders/PODetailsModal.tsx';
import ConfirmActionModal from '../components/common/ConfirmActionModal.tsx';
import { LuPlus, LuArrowLeft, LuPencil, LuEye, LuCheck, LuTrash2, LuX } from 'react-icons/lu';
import { formatCurrency } from '../utils/currency';

interface ExtendedPurchaseOrder extends PurchaseOrder {
  created_by_name?: string;
  received_by_name?: string;
  received_at?: string;
  canceled_by_name?: string;
  canceled_at?: string;
  updated_by_name?: string;
  updated_at?: string;
}

const PurchaseOrdersPage = (): JSX.Element => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState<ExtendedPurchaseOrder[]>([]);
  const [creators, setCreators] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState<number | null>(null);
  
  // Confirmations
  const [poToCancel, setPoToCancel] = useState<number | null>(null);
  const [poToDelete, setPoToDelete] = useState<number | null>(null);
  
  // Edit State
  const [poToEdit, setPoToEdit] = useState<POToEdit | null>(null);

  const navigate = useNavigate();
  const isAdmin = user?.role.includes('admin');

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams(searchParams);
    Promise.all([
      api.get<ExtendedPurchaseOrder[]>('/purchase-orders', { params }),
      api.get<User[]>('/users/creators')
    ]).then(([posRes, creatorsRes]) => {
      setPurchaseOrders(posRes.data);
      setCreators(creatorsRes.data);
    }).catch(() => toast.error(t('purchaseOrdersPage.fetchError')))
      .finally(() => setIsLoading(false));
  }, [searchParams, t, refreshKey]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(name, value); else newParams.delete(name);
    setSearchParams(newParams, { replace: true });
  };

  const handleBack = () => {
    if (Array.from(searchParams.keys()).length > 0) setSearchParams({}, { replace: true });
    else navigate('/', { replace: true });
  };

  // --- Actions ---
  const openCancelModal = (id: number) => { setPoToCancel(id); };
  const handleConfirmCancel = async () => {
      if (!poToCancel) return;
      setPurchaseOrders(prev => prev.map(po => po.id === poToCancel ? { ...po, status: 'Cancelled', canceled_at: new Date().toISOString(), canceled_by_name: 'Me' } : po));
      try {
          await api.put(`/purchase-orders/${poToCancel}/cancel`);
          toast.success("Purchase Order Cancelled");
          setRefreshKey(k => k + 1); 
      } catch (error: any) {
          toast.error(error.response?.data?.msg || "Failed to cancel");
          setRefreshKey(k => k + 1);
      }
      setPoToCancel(null);
  };

  const openDeleteModal = (id: number) => { setPoToDelete(id); };
  const handleConfirmDelete = async () => {
    if (!poToDelete) return;
    setPurchaseOrders(prev => prev.filter(po => po.id !== poToDelete));
    try {
        await api.delete(`/purchase-orders/${poToDelete}`);
        toast.success("Purchase Order deleted permanently");
        setRefreshKey(k => k + 1); 
    } catch (error: any) {
        const errMsg = error.response?.data?.msg || "Failed to delete. Check console.";
        toast.error(errMsg);
        setRefreshKey(k => k + 1);
    }
    setPoToDelete(null);
  };

  const handleEditPO = (po: ExtendedPurchaseOrder) => { 
      setPoToEdit({ id: po.id, supplier_name: po.supplier_name, supplier_id: undefined }); // supplier_id fetched inside modal
      setIsAddModalOpen(true);
  };
  const handleCloseAddModal = () => { setIsAddModalOpen(false); setPoToEdit(null); };
  
  const openReceiveModal = (poId: number) => { setSelectedPOId(poId); setIsReceiveModalOpen(true); };
  const openDetailsModal = (poId: number) => { setSelectedPOId(poId); setIsDetailsModalOpen(true); };
  const handleReceiveSuccess = () => { setRefreshKey(k => k + 1); toast.success(t('purchaseOrdersPage.stockAddedSuccess')); navigate('/inventory'); };
  const refetchData = () => setRefreshKey(k => k + 1);

  // --- Helpers ---
  const formatDateOnly = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }); 
  };
  const formatTimeOnly = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <>
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={handleBack} style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.3)', color: '#ffffff', padding: '0.6rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LuArrowLeft size={22} />
            </button>
            <h1>{t('purchaseOrdersPage.title')}</h1>
        </div>
        <button className="btn btn-primary" onClick={() => { setPoToEdit(null); setIsAddModalOpen(true); }}><LuPlus size={18} /> {t('purchaseOrdersPage.newPO')}</button>
      </div>

      <div className="table-toolbar">
        <div className="filters-container">
            <select name="status" className="filter-select" value={searchParams.get('status') || ''} onChange={handleFilterChange}>
                <option value="">{t('purchaseOrdersPage.filters.allStatuses')}</option>
                <option value="Pending">{t('poStatuses.Pending')}</option>
                <option value="Received">{t('poStatuses.Received')}</option>
                <option value="Cancelled">{t('poStatuses.Cancelled')}</option>
            </select>
            <select name="time_range" className="filter-select" value={searchParams.get('time_range') || ''} onChange={handleFilterChange}>
                <option value="">{t('purchaseOrdersPage.filters.allTime')}</option>
                <option value="today">{t('timeRanges.today')}</option>
                <option value="last_7_days">{t('timeRanges.last_7_days')}</option>
                <option value="last_30_days">{t('timeRanges.last_30_days')}</option>
                <option value="custom">{t('purchaseOrdersPage.filters.customRange')}</option>
            </select>
            {searchParams.get('time_range') === 'custom' && (
                <>
                    <div className="form-group-inline"><label>{t('purchaseOrdersPage.filters.from')}</label><input type="date" name="date_from" value={searchParams.get('date_from') || ''} onChange={handleFilterChange} /></div>
                    <div className="form-group-inline"><label>{t('purchaseOrdersPage.filters.to')}</label><input type="date" name="date_to" value={searchParams.get('date_to') || ''} onChange={handleFilterChange} /></div>
                </>
            )}
            <select name="created_by" className="filter-select" value={searchParams.get('created_by') || ''} onChange={handleFilterChange}>
                <option value="">{t('purchaseOrdersPage.filters.allCreators')}</option>
                {creators.map(c => <option key={c.id} value={String(c.id)}>{c.username}</option>)}
            </select>
        </div>
      </div>
      
      <div className="user-cards-grid">
        {isLoading ? <p className="text-center" style={{ gridColumn: '1 / -1' }}>{t('purchaseOrdersPage.loading')}</p> 
        : purchaseOrders.length > 0 ? (
          purchaseOrders.map(po => (
            <div key={po.id} className="user-card">
              <div className="user-card-header"><div className="user-card-info">
                  <h3 className="user-card-name">PO #{po.id}</h3>
                  <span className={`status-badge status-${po.status.toLowerCase()}`} style={po.status === 'Cancelled' ? { background: 'rgba(220, 53, 69, 0.2)', color: '#ff6b6b', border: '1px solid #dc3545' } : {}}>
                      {t(`poStatuses.${po.status}`)}
                  </span>
              </div></div>
              
              <div className="user-card-body">
                <p><strong>Supplier:</strong> {po.supplier_name}</p>
                <p><strong>Date:</strong> {formatDateOnly(po.date_created)}</p>
                <p><strong>Items:</strong> {po.total_items} | <strong>Units:</strong> {po.total_quantity}</p>
                <p><strong>Total:</strong> {formatCurrency(Number(po.total_value))}</p>
                <hr style={{ margin: '0.75rem 0', borderColor: 'rgba(255,255,255,0.1)' }}/>
                
                <div style={{ fontSize: '0.85rem', color: '#aaa', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Created by: <strong style={{ color: '#fff' }}>{po.created_by_name}</strong></span>
                    </div>
                    {po.updated_at && <div style={{ color: '#ebdf8a' }}>Edited by: <strong>{po.updated_by_name}</strong>{po.updated_at && <span style={{ opacity: 0.8 }}> at {formatTimeOnly(po.updated_at)}</span>}</div>}
                    {po.status === 'Received' && <div style={{ color: '#8aebbd' }}>Received by: <strong>{po.received_by_name}</strong>{po.received_at && <span style={{ opacity: 0.8 }}> at {formatTimeOnly(po.received_at)}</span>}</div>}
                    {po.status === 'Cancelled' && <div style={{ color: '#ff6b6b' }}>Cancelled by: <strong>{po.canceled_by_name || '-'}</strong>{po.canceled_at && <span style={{ opacity: 0.8 }}> at {formatTimeOnly(po.canceled_at)}</span>}</div>}
                </div>
              </div>

              <div className="user-card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => openDetailsModal(po.id)} style={{ display: 'flex', gap: '0.4rem' }}><LuEye size={16} /> View</button>
                
                {po.status === 'Pending' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-success btn-sm" onClick={() => openReceiveModal(po.id)} title="Receive"><LuCheck size={16} /></button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleEditPO(po)} title="Edit"><LuPencil size={16} /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => openCancelModal(po.id)} title="Cancel Order" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem' }}>
                        <LuX size={18} />
                    </button>
                  </div>
                )}

                {isAdmin && (po.status === 'Received' || po.status === 'Cancelled') && (
                    <button 
                        className="btn btn-danger btn-sm" 
                        onClick={() => openDeleteModal(po.id)} 
                        title="Delete Permanently"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem' }}
                    >
                        <LuTrash2 size={16} />
                    </button>
                )}
              </div>
            </div>
          ))
        ) : <div className="content-card text-center" style={{ gridColumn: '1 / -1' }}><p>No orders found.</p></div>}
      </div>

      <AddPOModal isOpen={isAddModalOpen} onClose={handleCloseAddModal} onSuccess={refetchData} initialData={poToEdit} />
      <ReceivePOModal isOpen={isReceiveModalOpen} onClose={() => setIsReceiveModalOpen(false)} onSuccess={handleReceiveSuccess} purchaseOrderId={selectedPOId} />
      <PODetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} purchaseOrderId={selectedPOId} />
      
      <ConfirmActionModal isOpen={!!poToCancel} onClose={() => setPoToCancel(null)} onConfirm={handleConfirmCancel} title="Cancel Purchase Order" message="Are you sure you want to cancel this order?" confirmLabel="Yes, Cancel Order" isDanger={true} />
      <ConfirmActionModal isOpen={!!poToDelete} onClose={() => setPoToDelete(null)} onConfirm={handleConfirmDelete} title="Delete Purchase Order" message="Are you sure you want to PERMANENTLY DELETE this record?" confirmLabel="Delete Forever" isDanger={true} />
    </>
  );
};
export default PurchaseOrdersPage;