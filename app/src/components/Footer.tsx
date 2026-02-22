import { useTranslation } from "react-i18next";

function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="">
      <div className="max-w-7xl m-auto w-full px-6 pb-4 text-foreground/65">
        &copy; {t('core.copyright')}
      </div>
    </footer>
  );
}

export default Footer;