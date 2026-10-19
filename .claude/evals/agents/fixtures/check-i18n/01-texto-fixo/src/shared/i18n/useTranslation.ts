export function useTranslation(ns: string): { t: (key: string) => string; locale: string } {
  return { t: (key) => `${ns}.${key}`, locale: 'pt-BR' };
}
