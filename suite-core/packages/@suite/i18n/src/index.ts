export interface I18nConfig {
  defaultLocale: string;
  supportedLocales: string[];
  fallbackLocale?: string;
  loadPath?: string;
}

export interface TranslationDict {
  [key: string]: string | TranslationDict;
}

export interface I18n {
  init(config: I18nConfig): Promise<void>;
  t(key: string, params?: Record<string, any>): string;
  setLocale(locale: string): Promise<void>;
  getLocale(): string;
  getSupportedLocales(): string[];
  addTranslations(locale: string, translations: TranslationDict): void;
}

export class I18nManager implements I18n {
  private config: I18nConfig;
  private currentLocale: string;
  private translations: Map<string, TranslationDict> = new Map();

  constructor() {
    this.config = {
      defaultLocale: 'en',
      supportedLocales: ['en']
    };
    this.currentLocale = 'en';
  }

  async init(config: I18nConfig): Promise<void> {
    this.config = config;
    this.currentLocale = config.defaultLocale;
    
    // Load translations for default locale
    await this.loadTranslations(config.defaultLocale);
  }

  t(key: string, params?: Record<string, any>): string {
    const translation = this.getTranslation(key);
    
    if (!params) {
      return translation;
    }
    
    // Simple template replacement
    return translation.replace(/\{\{(\w+)\}\}/g, (match, param) => {
      return params[param]?.toString() || match;
    });
  }

  async setLocale(locale: string): Promise<void> {
    if (!this.config.supportedLocales.includes(locale)) {
      throw new Error(`Locale ${locale} is not supported`);
    }
    
    if (!this.translations.has(locale)) {
      await this.loadTranslations(locale);
    }
    
    this.currentLocale = locale;
  }

  getLocale(): string {
    return this.currentLocale;
  }

  getSupportedLocales(): string[] {
    return [...this.config.supportedLocales];
  }

  addTranslations(locale: string, translations: TranslationDict): void {
    const existing = this.translations.get(locale) || {};
    this.translations.set(locale, this.mergeTranslations(existing, translations));
  }

  private getTranslation(key: string): string {
    const localeTranslations = this.translations.get(this.currentLocale);
    const fallbackTranslations = this.config.fallbackLocale 
      ? this.translations.get(this.config.fallbackLocale)
      : null;
    
    const translation = this.getNestedValue(localeTranslations, key) 
      || this.getNestedValue(fallbackTranslations, key);
    
    return translation || key;
  }

  private getNestedValue(obj: any, path: string): string | null {
    if (!obj) return null;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current[key] === undefined) {
        return null;
      }
      current = current[key];
    }
    
    return typeof current === 'string' ? current : null;
  }

  private mergeTranslations(target: TranslationDict, source: TranslationDict): TranslationDict {
    const result = { ...target };
    
    for (const key in source) {
      if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.mergeTranslations(
          (result[key] as TranslationDict) || {},
          source[key] as TranslationDict
        );
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  private async loadTranslations(locale: string): Promise<void> {
    // This would load from files in real implementation
    // For now, we'll add some default translations
    const defaultTranslations: Record<string, TranslationDict> = {
      en: {
        common: {
          save: 'Save',
          cancel: 'Cancel',
          delete: 'Delete',
          edit: 'Edit',
          search: 'Search',
          settings: 'Settings'
        },
        diskdominator: {
          scan: 'Scan Disk',
          analyze: 'Analyze',
          duplicates: 'Find Duplicates',
          organize: 'Organize Files',
          space_used: 'Space Used: {{size}}',
          files_found: '{{count}} files found'
        }
      },
      es: {
        common: {
          save: 'Guardar',
          cancel: 'Cancelar',
          delete: 'Eliminar',
          edit: 'Editar',
          search: 'Buscar',
          settings: 'Configuración'
        },
        diskdominator: {
          scan: 'Escanear Disco',
          analyze: 'Analizar',
          duplicates: 'Buscar Duplicados',
          organize: 'Organizar Archivos',
          space_used: 'Espacio Usado: {{size}}',
          files_found: '{{count}} archivos encontrados'
        }
      }
    };
    
    if (defaultTranslations[locale]) {
      this.addTranslations(locale, defaultTranslations[locale]);
    }
  }
}

// Export singleton instance
export const i18n = new I18nManager();