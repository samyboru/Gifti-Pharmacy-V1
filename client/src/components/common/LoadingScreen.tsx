// File Location: client/src/components/common/LoadingScreen.tsx

interface LoadingScreenProps {
    message?: string;
}

const LoadingScreen = ({ message = "Initializing Pharmacy..." }: LoadingScreenProps) => {
    return (
        <div className="loading-container">
            <div className="loading-logo">
                <div className="hexagon-container">
                    <div className="hexagon-shape"></div>
                </div>
                <span className="logo-text">Gifti</span>
            </div>
            <h1>Gifti Pharmacy</h1>
            <p className="loading-subtext">{message}</p>
        </div>
    );
};

export default LoadingScreen;