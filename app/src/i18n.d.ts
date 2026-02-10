
import 'i18next';
import cs from './locales/cs.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof cs;
    };
  }
}