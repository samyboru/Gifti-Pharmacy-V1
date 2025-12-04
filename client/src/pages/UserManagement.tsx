// File Location: client/src/pages/UserManagement.tsx

import { useState, useEffect, useMemo, JSX } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import api from '../services/api';
import { User, UserRole } from '../types'; // Import UserRole
import AddUserModal from '../components/users/AddUserModal.tsx';
import EditUserModal from '../components/users/EditUserModal.tsx';
import UserDetailsModal from '../components/users/UserDetailsModal.tsx';
import { LuSearch, LuMail, LuPhone, LuPencil, LuShieldCheck, LuUserX, LuUserCheck, LuPlus } from 'react-icons/lu';
import toast from 'react-hot-toast';

const UserManagement = (): JSX.Element => {
  const { t } = useTranslation();
  const { user: adminUser } = useAuth();

  if (adminUser && !adminUser.role.includes('admin')) {
    return <Navigate to="/" replace />;
  }
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    setError(null);
    api.get<User[]>('/users')
      .then(res => {
        if (Array.isArray(res.data)) { setUsers(res.data); } 
        else { setUsers([]); setError("Received invalid data from the server."); }
      })
      .catch(err => {
        console.error("Fetch users error:", err);
        setError(err.response?.data?.msg || t('userManagementPage.fetchError'));
        setUsers([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (adminUser) fetchUsers(); }, [adminUser, t]);

  const filteredUsers = useMemo(() => {
    return users
      // --- THIS LOGIC IS UPDATED ---
      .filter(u => roleFilter ? u.role.includes(roleFilter as UserRole) : true)
      .filter(u => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return u.username.toLowerCase().includes(lowerSearchTerm) ||
               (u.email && u.email.toLowerCase().includes(lowerSearchTerm));
      });
  }, [users, searchTerm, roleFilter]);

  const openEditModal = (userToEdit: User) => {
    setSelectedUser(userToEdit);
    setIsEditModalOpen(true);
  };
  
  const openDetailsModal = (userToView: User) => {
    setSelectedUser(userToView);
    setIsDetailsModalOpen(true);
  };

  const handleChangeStatus = async (userId: number, newStatus: User['status']) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;
    
    const originalUsers = [...users];
    setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    
    const toastId = toast.loading(t('notifications.userStatusUpdating', { username: userToUpdate.username }));
    
    try {
        await api.put(`/users/${userId}/status`, { status: newStatus });
        toast.success(t('notifications.userStatusUpdateSuccess'), { id: toastId });
        fetchUsers();
    } catch (err: any) {
        const errorMessage = err.response?.data?.msg || 'notifications.userStatusUpdateError';
        toast.error(t(errorMessage), { id: toastId });
        setUsers(originalUsers);
    }
  };

  if (!adminUser) {
    return <p className="text-center">{t('userManagementPage.verifying')}</p>;
  }

  return (
    <>
      <div className="header">
        <h1>{t('userManagementPage.title')}</h1>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <LuPlus size={18} /> {t('userManagementPage.addUser')}
        </button>
      </div>

      <div className="table-toolbar">
        <div className="search-container">
          <LuSearch className="search-icon" />
          <input 
            type="text" 
            className="search-input" 
            placeholder={t('userManagementPage.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filters-container">
          <select 
            className="filter-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">{t('userManagementPage.allRoles')}</option>
            <option value="admin">{t('roles.admin')}</option>
            <option value="pharmacist">{t('roles.pharmacist')}</option>
            <option value="cashier">{t('roles.cashier')}</option>
          </select>
        </div>
      </div>
      
      {loading ? <p className="text-center">{t('userManagementPage.loading')}</p> : error ? <p className="login-error text-center">{error}</p> : (
        <div className="user-cards-grid">
          {filteredUsers.map(user => (
            <div key={user.id} className="user-card">
              <div className="user-card-header">
                <div className={`user-card-avatar status-${user.status}`}>{(user?.username || "U").charAt(0)}</div>
                <div className="user-card-info">
                  <h3 className="user-card-name">{user.username}</h3>
                  <div className="role-badge-container">
                    {user.role.map(role => (
                      <span key={role} className={`role-badge role-${role}`}>{t(`roles.${role}`)}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="user-card-body">
                <div className="user-card-contact"><LuMail />{user.email || t('common.notAvailable')}</div>
                {user.phone && <div className="user-card-contact"><LuPhone /><span>{user.phone}</span></div>}
              </div>
              <div className="user-card-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => openDetailsModal(user)}>
                  {t('userManagementPage.card.viewDetails')}
                </button>
                <div className="action-buttons">
                  <button className="btn-icon" title={t('userManagementPage.card.edit')} onClick={() => openEditModal(user)}><LuPencil size={18} /></button>
                  
                  {user.status === 'active' && 
                    <button className="btn-icon btn-icon-danger" title={t('userManagementPage.card.block')} onClick={() => handleChangeStatus(user.id, 'blocked')}><LuUserX size={18} /></button>}
                  
                  {(user.status === 'inactive' || user.status === 'blocked') &&
                    <button className="btn-icon btn-icon-success" title={t('userManagementPage.card.activate')} onClick={() => handleChangeStatus(user.id, 'active')}><LuUserCheck size={18} /></button>}
                  
                  {user.status === 'locked' &&
                    <button className="btn-icon" title={t('userManagementPage.card.unlock')} onClick={() => handleChangeStatus(user.id, 'active')}><LuShieldCheck size={18} /></button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={fetchUsers} />
      <EditUserModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSuccess={fetchUsers} user={selectedUser} />
      <UserDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} user={selectedUser} />
    </>
  );
};
export default UserManagement;