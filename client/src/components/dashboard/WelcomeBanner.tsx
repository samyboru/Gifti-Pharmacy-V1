// File Location: client/src/components/dashboard/WelcomeBanner.tsx

import { useAuth } from '../../context/AuthContext';

const WelcomeBanner = () => {
    const { user } = useAuth();

    // Capitalize the first letter of the username safely
    const safeUsername = user?.username ?? 'User';
    const displayName =
        typeof safeUsername === 'string' && safeUsername.length > 0
            ? safeUsername.charAt(0).toUpperCase() + safeUsername.slice(1)
            : 'User';

    return (
        <div className="welcome-banner">
            <div className="welcome-text">
                <h2>Welcome back, {displayName}!</h2>
                <p>Here is a summary of your pharmacy's activity today.</p>
            </div>
        </div>
    );
};

export default WelcomeBanner;