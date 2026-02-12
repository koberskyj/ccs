import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';

export default function LanguageSwitcher({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language ? i18n.language.split('-')[0] : 'cs';

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value); 
  };

  return (
    <Select value={currentLang} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-auto border-none shadow-none bg-transparent px-2 focus:ring-0 hover:bg-slate-100 rounded-md transition-colors [&>.lucide-chevron-down]:hidden">
        {children}
      </SelectTrigger>

      <SelectContent align="end">
        <SelectItem value="cs">
          <span className="flex items-center gap-2">
            Čeština
          </span>
        </SelectItem>
        <SelectItem value="en">
          <span className="flex items-center gap-2">
            English
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};