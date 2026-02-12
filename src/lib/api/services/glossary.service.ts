import { BaseService } from './base.service';

interface GlossaryItem {
  id: number;
  label: string;
  name?: string | null;
  [key: string]: any;
}

export class GlossaryService extends BaseService {
  // Instance-level cache instead of static to avoid test pollution
  private cache: Record<string, GlossaryItem[]> = {};

  /**
   * Универсальный метод получения данных
   * Автоматически определяет, пришел массив или объект-обертка
   */
  private async getOrFetch(endpoint: string, cacheKey: string): Promise<GlossaryItem[]> {
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }

    const headers = await this.getHeaders();
    const response = await this.request.get(endpoint, { headers });

    if (!response.ok()) {
      await this.handleResponseError(response, `Fetching glossary: ${cacheKey}`);
    }

    const data = await response.json();
    let items: GlossaryItem[] = [];

    // Логика обработки разных форматов ответа
    if (Array.isArray(data)) {
      items = data;
    } else if (data.items && Array.isArray(data.items)) {
      items = data.items;
    } else if (data.data && Array.isArray(data.data)) {
      items = data.data;
    } else {
      console.warn(`[Glossary] Warning: Unexpected format for ${endpoint}`, data);
      items = [];
    }

    this.cache[cacheKey] = items;
    return items;
  }

  /**
   * Универсальный метод поиска ID по названию (label или name)
   */
  private findIdByLabel(list: GlossaryItem[], label: string, context: string): number {
    const search = label.trim().toLowerCase();
    
    const item = list.find((i) => {
      const matchLabel = i.label?.trim().toLowerCase() === search;
      const matchName = i.name?.trim().toLowerCase() === search;
      return matchLabel || matchName;
    });

    if (!item) {
      // Если не нашли, выводим список доступных опций (первые 10), чтобы было проще искать ошибку
      const available = list.slice(0, 10).map((i) => i.label).join(', ');
      throw new Error(
        `Glossary Error: Could not find '${label}' in ${context}. First 10 options: [${available}...]`
      );
    }
    return item.id;
  }

  
  // PUBLIC METHODS (API Methods)
  
  // 1. Специализация (Specialization)
  async getSpecializationId(label: string): Promise<number> {
    const list = await this.getOrFetch(
      '/api/v1/glossary/company/GlossarySpecialization/autocomplete', 
      'specializations'
    );
    return this.findIdByLabel(list, label, 'Specializations');
  }

  // 2. Мед. должность (Medical Job Position)
  async getMedicalJobPositionId(label: string): Promise<number> {
    const list = await this.getOrFetch(
      '/api/v1/glossary/company/GlossaryMedicalJobPosition/autocomplete', 
      'medical-job-positions'
    );
    return this.findIdByLabel(list, label, 'Medical Job Positions');
  }

  // 3. Обычная должность (Job Position)
  async getJobPositionId(label: string): Promise<number> {
    const list = await this.getOrFetch(
      '/api/v1/glossary/company/GlossaryJobPosition/autocomplete', 
      'job-positions'
    );
    return this.findIdByLabel(list, label, 'Job Positions');
  }

  // 4. Филиалы (Branches)
  async getBranchId(label?: string): Promise<number> {
    const list = await this.getOrFetch(
      '/api/v1/branches/autocomplete', 
      'branches'
    );

    if (!label) {
      if (list.length === 0) throw new Error('Glossary Error: No branches found.');
      return list[0].id;
    }
    return this.findIdByLabel(list, label, 'Branches');
  }

  /**
   * Clear instance cache (useful for tests)
   */
  clearCache(): void {
    this.cache = {};
  }
}