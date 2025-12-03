// File Location: client/src/components/users/UserCard.tsx
import { LuMail, LuPhone, LuPencil, LuTrash2 } from 'react-icons/lu';
import React from 'react';
import type { User, UserRole } from '../../types';

type Props = { user: User };

const formatRoles = (roles?: UserRole | UserRole[] | string) => {
  if (!roles) return '';
  return Array.isArray(roles) ? roles.join(', ') : String(roles);
};

const RoleBadge: React.FC<{ roles: string }> = ({ roles }) => (
  <div className="role-badge">{roles}</div>
);

const UserCard: React.FC<Props> = ({ user }) => {
  // support both `roles` (array) and `role` (single) from your User type
  const rawRoles = (user as any).roles ?? (user as any).role;
  const rolesStr = formatRoles(rawRoles);

  return (
    <div className="user-card">
      <h3>{user?.username ?? 'Unknown'}</h3>
      <p>{user?.email ?? ''}</p>
      <RoleBadge roles={rolesStr} />
    </div>
  );
};

export default UserCard;