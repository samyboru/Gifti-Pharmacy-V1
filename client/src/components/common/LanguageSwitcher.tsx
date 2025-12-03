// File Location: client/src/components/common/LanguageSwitcher.tsx
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="language-switcher">
      <select onChange={handleLanguageChange} value={i18n.language}>
        <option value="en">English</option>
        <option value="am">አማርኛ</option>
        <option value="om">Afaan Oromoo</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;