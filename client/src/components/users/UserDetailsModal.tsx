// File Location: client/src/components/users/UserDetailsModal.tsx

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal.tsx';
import api from '../../services/api';
import { User, ActivityLog } from '../../types';
//import { LuMail, LuPhone } from 'react-icons/lu';
import DetailCard from '../common/DetailCard.tsx';
interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const LogDetails = ({ log }: { log: Pick<ActivityLog, 'action' | 'details'> }) => {
    const { t } = useTranslation();
    if (!log.details) return <span>{t('common.notAvailable')}</span>;

    try {
        const parsedDetails = JSON.parse(log.details);
        const translationKey = `activityLogDetails.${log.action.toLowerCase().replace(/ /g, '_')}`;
        
        if (parsedDetails.status) {
            parsedDetails.status = t(`userStatuses.${parsedDetails.status}`, parsedDetails.status);
        }
        return <span>{t(translationKey, parsedDetails) as string}</span>;
        
    } catch (e) {
        // Fallback for old, non-JSON details
    }
    return <span>{log.details}</span>;
};


const UserDetailsModal = ({ isOpen, onClose, user }: UserDetailsModalProps) => {
  const { t } = useTranslation();
  const [activity, setActivity] = useState<(Pick<ActivityLog, 'id' | 'action' | 'details' | 'timestamp'>)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      setLoading(true);
      setActivity([]);
      api.get(`/users/${user.id}/activity`)
        .then(res => setActivity(res.data))
        .catch(err => console.error("Failed to fetch user activity", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, user]);

  if (!user) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  const renderLogAction = (action: string) => {
    const translationKey = action.toLowerCase().replace(/ /g, '_');
    return t(`activityLogActions.${translationKey}`, action.replace(/_/g, ' '));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('userDetailsModal.title')} size="md">
      <div className="details-grid-container">
        <div className="user-card-header" style={{ padding: '0 0 1.5rem 0', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          <div className="user-card-avatar">{user.username.charAt(0).toUpperCase()}</div>
          <div className="user-card-info">
            <h3 className="user-card-name">{user.username}</h3>
            {user.role.map(role => (
              <span key={role} className={`role-badge role-${role.toLowerCase()}`}>{t(`roles.${role}`)}</span>
            ))}
          </div>
        </div>

        {/* --- THIS SECTION IS UPDATED --- */}
        <h4 className="details-section-title">{t('userDetailsModal.contactInfo')}</h4>
        <div className="details-grid">
            <DetailCard label={t('userDetailsModal.email')} value={user.email || t('common.notAvailable')} />
            {user.phone && (
              <DetailCard label={t('userDetailsModal.phone')} value={user.phone} />
            )}
        </div>
        
        <div className="details-section" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <h4 className="details-section-title">{t('userDetailsModal.recentActivity')}</h4>
          <div className="activity-log-list" style={{ padding: 0 }}>
            {loading && <p className="text-center">{t('userDetailsModal.loading')}</p>}
            {!loading && activity.length === 0 && <li className="no-activity">{t('userDetailsModal.noActivity')}</li>}
            {!loading && activity.slice(0, 5).map((log) => (
              <li key={log.id}>
                  <div className="log-action">{renderLogAction(log.action)}</div>
                  <div className="log-details"><LogDetails log={log} /></div>
                  <div className="log-timestamp">{formatDate(log.timestamp)}</div>
              </li>
            ))}
          </div>
        </div>
      </div>

      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>{t('common.close')}</button>
      </div>
    </Modal>
  );
};

export default UserDetailsModal