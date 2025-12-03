// File Location: client/src/pages/ActivityLogPage.tsx

import { useState, useEffect, useMemo, JSX } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { ActivityLog, User } from '../types';
import { LuSearch } from 'react-icons/lu';
import { formatCurrency } from '../utils/currency';

const ActionBadge = ({ action }: { action: string }) => {
    const { t } = useTranslation();
    let className = 'default';
    const lowerAction = action.toLowerCase().replace(/_/g, ' ');

    if (lowerAction.includes('delete')) className = 'delete';
    else if (lowerAction.includes('login')) className = 'login';
    else if (lowerAction.includes('update') || lowerAction.includes('adjust')) className = 'update';
    else if (lowerAction.includes('create') || lowerAction.includes('receive')) className = 'create';

    const translationKey = action.toLowerCase().replace(/ /g, '_');
    return <span className={`log-action-badge ${className}`}>{t(`activityLogActions.${translationKey}`, action.replace(/_/g, ' '))}</span>;
};

const LogDetails = ({ log }: { log: Pick<ActivityLog, 'action' | 'details'> }) => {
    const { t } = useTranslation();
    if (!log.details) return <span>{t('common.notAvailable')}</span>;

    try {
        const parsedDetails = JSON.parse(log.details);
        const translationKey = `activityLogDetails.${log.action.toLowerCase().replace(/ /g, '_')}`;
        
        if (parsedDetails.status) {
            parsedDetails.status = t(`userStatuses.${parsedDetails.status}`, parsedDetails.status);
        }
        
        // Format total if it exists
        if (parsedDetails.total) {
            parsedDetails.total = formatCurrency(Number(parsedDetails.total));
        }

        return <span>{t(translationKey, parsedDetails) as string}</span>;
        
    } catch (e) {
        // Fallback for old, non-JSON details
    }
    return <span>{log.details}</span>;
};

const ActivityLogPage = (): JSX.Element => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedAction, setSelectedAction] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [logsRes, usersRes] = await Promise.all([
          api.get<ActivityLog[]>('/activity-log'),
          api.get<User[]>('/users')
        ]);
        setLogs(logsRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        setError(t('activityLogPage.fetchError'));
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [t]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
    });
  };

  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => selectedUser ? log.username === selectedUser : true)
      .filter(log => selectedAction ? log.action === selectedAction : true)
      .filter(log => searchTerm ? 
        (log.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         log.details?.toLowerCase().includes(searchTerm.toLowerCase()))
        : true
      );
  }, [logs, searchTerm, selectedUser, selectedAction]);

  const uniqueActions = useMemo(() => [...new Set(logs.map(log => log.action))].sort(), [logs]);

  return (
    <>
      <div className="header">
        <h1>{t('activityLogPage.title')}</h1>
      </div>
      
      <div className="content-card">
        <div className="table-toolbar">
            <div className="search-container">
              <LuSearch className="search-icon" />
              <input 
                type="text" 
                className="search-input" 
                placeholder={t('activityLogPage.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filters-container">
              <select className="filter-select">
                  <option>{t('purchaseOrdersPage.filters.allTime')}</option>
              </select>
              <select className="filter-select" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                <option value="">{t('activityLogPage.allUsers')}</option>
                {users.map(user => <option key={user.id} value={user.username}>{user.username}</option>)}
              </select>
              <select className="filter-select" value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)}>
                <option value="">{t('activityLogPage.allActions')}</option>
                {uniqueActions.map(action => {
                    const translationKey = action.toLowerCase().replace(/ /g, '_');
                    return <option key={action} value={action}>{t(`activityLogActions.${translationKey}`, action.replace(/_/g, ' '))}</option>
                })}
              </select>
            </div>
        </div>
        
        <div className="activity-log-container">
            <div className="log-header-row">
                <span>{t('activityLogPage.table.timestamp')}</span>
                <span>{t('activityLogPage.table.user')}</span>
                <span>{t('activityLogPage.table.action')}</span>
                <span>{t('activityLogPage.table.details')}</span>
            </div>
            {isLoading ? (
                <div className="text-center" style={{ padding: '2rem' }}>{t('activityLogPage.loading')}</div>
            ) : error ? (
                <div className="login-error text-center" style={{ padding: '2rem' }}>{error}</div>
            ) : filteredLogs.length > 0 ? (
                filteredLogs.map(log => (
                <div key={log.id} className="log-item">
                    <div className="log-timestamp">{formatDate(log.timestamp)}</div>
                    <div className="log-user">{log.username || t('activityLogPage.systemUser')}</div>
                    <div><ActionBadge action={log.action} /></div>
                    <div className="log-details-text"><LogDetails log={log} /></div>
                </div>
                ))
            ) : (
                <div className="text-center" style={{ padding: '2rem' }}>{t('activityLogPage.noRecords')}</div>
            )}
        </div>
      </div>
    </>
  );
};

export default ActivityLogPage;