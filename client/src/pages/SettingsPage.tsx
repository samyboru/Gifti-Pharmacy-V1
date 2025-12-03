// File Location: client/src/pages/SettingsPage.tsx

import { JSX, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, Theme } from '../context/ThemeContext.tsx';

// Define a type for the custom color settings
interface CustomColors {
  primary: string;
  background: string;
  text: string;
}

const SettingsPage = (): JSX.Element => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  // State to manage whether the user is in 'preset' or 'custom' mode
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');

  // State to hold the user's custom color choices
  const [customColors, setCustomColors] = useState<CustomColors>({
    primary: '#007aff',
    background: '#ffffff',
    text: '#111827',
  });

  // This is our official, up-to-date list of preset themes
  const themePresets: { name: Theme; label: string; colors: string[] }[] = [
    { name: 'gopharma-blue', label: 'GO-Pharma Blue', colors: ['#007aff', '#f7f7f8', '#111827'] },
    { name: 'light', label: 'Light', colors: ['#2563eb', '#f8fafc', '#020617'] },
    { name: 'dark', label: 'Dark', colors: ['#3f83f8', '#1f2937', '#0B293C'] },
    { name: 'oceanic', label: 'Oceanic', colors: ['#26C6DA', '#0A1924', '#E0F7FA'] },
  ];

  // Handler for when a user clicks a preset theme card
  const handlePresetChange = (themeName: Theme) => {
    setMode('preset');
    setTheme(themeName);
  };

  // Handler for when a user changes a custom color
  const handleColorChange = (colorName: keyof CustomColors, value: string) => {
    setMode('custom');
    const newColors = { ...customColors, [colorName]: value };
    setCustomColors(newColors);

    // Apply custom colors to the document's root element as CSS variables
    const root = document.documentElement;
    root.style.setProperty('--custom-primary-color', newColors.primary);
    root.style.setProperty('--custom-background-color', newColors.background);
    root.style.setProperty('--custom-text-color', newColors.text);

    // Switch to a generic 'custom' theme class on the body
    // We need to know if the custom theme is light or dark for text contrast
    const isDark = isColorDark(newColors.background);
    document.body.className = `custom-theme ${isDark ? 'dark-theme' : 'light-theme'}`;
  };

  // Helper function to determine if a color is light or dark
  const isColorDark = (hexColor: string) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    // Formula for perceived brightness (luminance)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  };

  return (
    <>
      <div className="header">
        <h1>{t('settingsPage.title', 'Settings')}</h1>
      </div>

      <div className="settings-container">
        {/* Appearance Section */}
        <div className="settings-section">
          <div className="settings-header">
            <h2>{t('settingsPage.appearance', 'Appearance')}</h2>
          </div>
          <div className="settings-body">
            
            {/* Mode Switcher (Preset vs Custom) */}
            <div className="form-group">
              <label>{t('settingsPage.themeMode', 'Theme Mode')}</label>
              <div className="theme-choice-group">
                <div className="theme-choice">
                  <input type="radio" id="mode-preset" name="theme-mode" value="preset" checked={mode === 'preset'} onChange={() => setMode('preset')} />
                  <label htmlFor="mode-preset">{t('settingsPage.presets', 'Presets')}</label>
                </div>
                <div className="theme-choice">
                  <input type="radio" id="mode-custom" name="theme-mode" value="custom" checked={mode === 'custom'} onChange={() => setMode('custom')} />
                  <label htmlFor="mode-custom">{t('settingsPage.custom', 'Custom')}</label>
                </div>
              </div>
            </div>

            {/* Preset Themes Section */}
            <div className={`form-group ${mode !== 'preset' ? 'disabled' : ''}`}>
              <label>{t('settingsPage.presets', 'Presets')}</label>
              <div className="theme-switcher">
                {themePresets.map(preset => (
                  <div key={preset.name} className={`theme-card ${theme === preset.name && mode === 'preset' ? 'active' : ''}`} onClick={() => handlePresetChange(preset.name)}>
                    <div className="theme-preview">
                      <span className="theme-preview-swatch" style={{ backgroundColor: preset.colors[0] }}></span>
                      <span className="theme-preview-swatch" style={{ backgroundColor: preset.colors[1] }}></span>
                      <span className="theme-preview-swatch" style={{ backgroundColor: preset.colors[2] }}></span>
                    </div>
                    <p>{preset.label}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Custom Colors Section */}
            <div className={`form-group ${mode !== 'custom' ? 'disabled' : ''}`}>
              <label>{t('settingsPage.customColors', 'Custom Colors')}</label>
              <div className="color-pickers-container">
                <div className="color-picker-group">
                  <label htmlFor="primary-color">{t('settingsPage.primary', 'Primary')}</label>
                  <input type="color" id="primary-color" value={customColors.primary} onChange={(e) => handleColorChange('primary', e.target.value)} />
                </div>
                <div className="color-picker-group">
                  <label htmlFor="background-color">{t('settingsPage.background', 'Background')}</label>
                  <input type="color" id="background-color" value={customColors.background} onChange={(e) => handleColorChange('background', e.target.value)} />
                </div>
                <div className="color-picker-group">
                  <label htmlFor="text-color">{t('settingsPage.text', 'Text')}</label>
                  <input type="color" id="text-color" value={customColors.text} onChange={(e) => handleColorChange('text', e.target.value)} />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Profile Settings Section */}
        <div className="settings-section">
          <div className="settings-header">
            <h2>{t('settingsPage.profileSettings', 'Profile Settings')}</h2>
          </div>
          <div className="settings-body">
            <p className="placeholder-text">{t('settingsPage.profileSettingsHint', 'Profile and password management options will be available here in a future update.')}</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;