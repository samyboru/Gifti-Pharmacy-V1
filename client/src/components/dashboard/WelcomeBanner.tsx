// File Location: client/src/components/dashboard/WelcomeBanner.tsx

import { useAuth } from '../../context/AuthContext';

const WelcomeBanner = () => {
    const { user } = useAuth();

    // --- THIS IS THE FIX ---
    // Capitalize the first letter of the username for a nicer display
    const displayName = user?.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : 'User';

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