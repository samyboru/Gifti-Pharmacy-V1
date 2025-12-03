// File Location: client/src/pages/SuppliersPage.tsx

import { useState, useEffect, useMemo, JSX } from 'react';
import { useTranslation } from 'react-i18next'; // <-- Import hook
import api from '../services/api';
import { Supplier } from '../types';
import { LuSearch, LuPencil, LuTrash2, LuPlus } from 'react-icons/lu';
import AddSupplierModal from '../components/suppliers/AddSupplierModal.tsx';
import EditSupplierModal from '../components/suppliers/EditSupplierModal.tsx';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal.tsx';
import toast from 'react-hot-toast';

const SuppliersPage = (): JSX.Element => {
  const { t } = useTranslation(); // <-- Initialize hook
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // State for the delete modal workflow
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Function to fetch or re-fetch supplier data
  const fetchSuppliers = () => {
    setLoading(true);
    api.get<Supplier[]>('/suppliers')
      .then(res => {
        if (Array.isArray(res.data)) {
          setSuppliers(res.data);
        } else {
          setSuppliers([]);
        }
      })
      .catch(err => {
        console.error("Failed to fetch suppliers", err);
        setSuppliers([]);
      })
      .finally(() => setLoading(false));
  };

  // Fetch data on initial component mount
  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Memoized filtering logic for the search bar
  const filteredSuppliers = useMemo(() => {
    if (!searchTerm) return suppliers;
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.contact_person && supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [suppliers, searchTerm]);

  // Handler to open the edit modal
  const openEditModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsEditModalOpen(true);
  };

  // Handlers for the new delete modal workflow
  const openDeleteModal = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSupplierToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!supplierToDelete) return;

    setIsDeleting(true);
    const toastId = toast.loading(t('notifications.deletingSupplier'));

    api.delete(`/suppliers/${supplierToDelete.id}`)
      .then(() => {
        toast.success(t('notifications.supplierDeletedSuccess'), { id: toastId });
        fetchSuppliers();
        closeDeleteModal();
      })
      .catch(err => {
        toast.error(err.response?.data?.msg || t('notifications.supplierDeleteError'), { id: toastId });
        closeDeleteModal();
      })
      .finally(() => {
        setIsDeleting(false);
      });
  };

  return (
    <>
      <div className="header">
        <h1>{t('suppliersPage.title')}</h1>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <LuPlus size={18}/> {t('suppliersPage.addNew')}
        </button>
      </div>

      <div className="table-toolbar">
        <div className="search-container">
          <LuSearch className="search-icon" />
          <input 
            type="text" 
            placeholder={t('suppliersPage.searchPlaceholder')}
            className="search-input" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('suppliersPage.table.companyName')}</th>
              <th>{t('suppliersPage.table.contactPerson')}</th>
              <th>{t('suppliersPage.table.email')}</th>
              <th>{t('suppliersPage.table.phone')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center">{t('suppliersPage.loading')}</td></tr>
            ) : filteredSuppliers.map(supplier => (
              <tr key={supplier.id}>
                <td>{supplier.name}</td>
                <td>{supplier.contact_person || t('common.notAvailable')}</td>
                <td>{supplier.email ? <a href={`mailto:${supplier.email}`} className="link-style">{supplier.email}</a> : t('common.notAvailable')}</td>
                <td>{supplier.phone || t('common.notAvailable')}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" onClick={() => openEditModal(supplier)} title={t('common.edit')}><LuPencil size={18} /></button>
                    <button className="btn-icon btn-icon-danger" onClick={() => openDeleteModal(supplier)} title={t('common.delete')}>
                      <LuTrash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddSupplierModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={fetchSuppliers} />
      <EditSupplierModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSuccess={fetchSuppliers} supplier={selectedSupplier} />
      
      <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        title={t('modals.deleteSupplierTitle')}
        message={t('modals.deleteSupplierMessage', { name: supplierToDelete?.name })}
        loading={isDeleting}
      />
    </>
  );
};

export default SuppliersPage;