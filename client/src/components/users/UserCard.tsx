// File Location: client/src/components/users/UserCard.tsx
import { LuMail, LuPhone, LuPencil, LuTrash2 } from 'react-icons/lu';
import { User } from '../../types'; // We will create this type definition

interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (userId: number) => void;
}

const UserCard = ({ user, onEdit, onDelete }: UserCardProps) => {
  const getRoleClass = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'role-admin';
      case 'pharmacist': return 'role-pharmacist';
      case 'cashier': return 'role-cashier';
      default: return '';
    }
  };

  return (
    <div className="user-card">
      <div className="card-header">
        <div className="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
        <div className="user-details">
          <span className="user-name">{user.username}</span>
          <span className={`user-role ${getRoleClass(user.role)}`}>{user.role}</span>
        </div>
      </div>
      <div className="card-body">
        <div className="contact-info">
          <LuMail /> <span>{user.email}</span>
        </div>
        {user.phone && (
          <div className="contact-info">
            <LuPhone /> <span>{user.phone}</span>
          </div>
        )}
      </div>
      <div className="card-footer">
        <button className="details-button">View Details</button>
        <div className="action-icons">
          <button onClick={() => onEdit(user)} title="Edit User"><LuPencil /></button>
          <button onClick={() => onDelete(user.id)} title="Delete User"><LuTrash2 /></button>
        </div>
      </div>
    </div>
  );
};

export default UserCard;