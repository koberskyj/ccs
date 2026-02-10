
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";

function Header() {
  const { t } = useTranslation();

  return (
    <header className="max-w-[1280px] w-full mx-auto my-6 px-6 flex justify-between items-center gap-4 flex-wrap">
      <h1 className="text-2xl font-semibold">{t('core.ccs')}</h1>
      <div className="flex gap-4 justify-end flex-1">
        <LanguageSwitcher />
      </div>
    </header>
  );
}

export default Header;