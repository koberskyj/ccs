
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { BookOpenText, Earth } from "lucide-react";
import { Button } from "./ui/button";
import Tutorial from "./Tutorial";

function Header() {
  const { t } = useTranslation();

  return (
    <header className="max-w-7xl w-full mx-auto my-6 px-6 flex justify-between items-center gap-4 flex-wrap">
      <h1 className="text-2xl font-semibold">{t('core.ccs')}</h1>
      <div className="flex gap-2 items-center justify-end flex-1">
        <Tutorial>
          <Button className="border-none shadow-none bg-transparent hover:bg-slate-100 rounded-md transition-colors text-foreground gap-1 px-2">
            <BookOpenText className="h-5! w-5!" />
            <span className="text-foreground font-semibold opacity-80">{t('core.help')}</span>
          </Button>
        </Tutorial>
        <LanguageSwitcher>
          <div className="flex items-center gap-1">
            <Earth className="h-5 w-5" />
            <span className="text-foreground font-semibold opacity-80">{t('core.language')}</span>
          </div>
        </LanguageSwitcher>
      </div>
    </header>
  );
}

export default Header;