// File Location: client/src/components/common/RotatingBackground.tsx

import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

const backgroundImages = [
        '/images/login-background.PNG',
      '/images/login-background-1.jpg',
      '/images/login-background-2.jpg',
      '/images/login-background-3.jpg',
      '/images/login-background-4.jpg',  
      '/images/login-background-5.jpg',
      '/images/login-background-6.jpg',
      '/images/login-background-7.jpg',
      '/images/login-background-8.jpg',
      '/images/login-background-9.jpg',
      '/images/login-background-10.jpg',
      '/images/login-background-11.jpg',
      '/images/login-background-12.jpg',
];

const CHANGE_INTERVAL = 60000; 

const RotatingBackground = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { theme } = useTheme();

  // This determines if the background should be visible at all
  const isLightTheme = theme === 'light' || theme === 'gopharma-blue';

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex(prevIndex => (prevIndex + 1) % backgroundImages.length);
    }, CHANGE_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  // If it's not a light theme, render nothing.
  if (!isLightTheme) {
    return null;
  }

  return (
    <div className="rotating-background">
      {backgroundImages.map((imageUrl, index) => (
        <div
          key={index}
          className="background-image"
          style={{
            backgroundImage: `url(${imageUrl})`,
            opacity: index === currentImageIndex ? 1 : 0,
          }}
        />
      ))}
      {/* --- THIS IS THE NEW PART: The overlay is now inside this component --- */}
      <div className="background-overlay"></div>
    </div>
  );
};

export default RotatingBackground;