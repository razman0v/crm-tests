import { BaseService } from './base.service';

/** Thrown when no nomenclature of any accepted type exists for the patient's environment. */
export class CriticalDataMissingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CriticalDataMissingError';
  }
}

export interface NomenclatureItem {
  id: number;
  title: string;
  name?: string;
  isActive?: boolean;
  [key: string]: any;
}

/** Lowercase type values accepted by the backend. */
export type NomenclatureType = 'service' | 'kit';

export class NomenclatureService extends BaseService {
  /**
   * Fetch nomenclature items.
   *
   * Matches the exact network format observed in UI logs:
   *   /api/v1/stock/nomenclatures?nomenclatureTypes[]=service&patientId={id}&page=1&pageSize=20
   *
   * @param patientId - Required by the backend; scopes results to the patient's context.
   * @param types     - Lowercase type filter. Defaults to ['service'].
   * @param page      - 1-based page number.
   * @param pageSize  - Items per page.
   */
  async list(
    patientId: number,
    types: NomenclatureType[] = ['service'],
    page = 1,
    pageSize = 20,
  ): Promise<NomenclatureItem[]> {
    // Build query manually to preserve the bracket notation nomenclatureTypes[]=value
    const typeParts = types.map((t) => `nomenclatureTypes[]=${encodeURIComponent(t)}`).join('&');
    const url = `/api/v1/stock/nomenclatures?${typeParts}&patientId=${patientId}&page=${page}&pageSize=${pageSize}`;

    const data = await this.get<any>(url);

    if (Array.isArray(data)) return data as NomenclatureItem[];
    if (data.items && Array.isArray(data.items)) return data.items as NomenclatureItem[];
    if (data.data && Array.isArray(data.data)) return data.data as NomenclatureItem[];

    throw new Error(
      `[NomenclatureService] Unexpected response format. ` +
        `Expected array or {items:[]} or {data:[]}. Got: ${JSON.stringify(data).slice(0, 200)}`,
    );
  }

  /**
   * Return the first active nomenclature item for a patient.
   *
   * Discovery order (environment-agnostic fallback chain):
   *   1. Try type=service  — preferred for visit stock assignment
   *   2. Fallback to type=kit — used when no standalone services are configured
   *   3. Throw CriticalDataMissingError — ensures the test fails with a clear root cause
   *      rather than a cryptic 400 from the visit creation API.
   *
   * @param patientId - The patient whose nomenclature catalogue is scoped.
   */
  async getFirstActive(patientId: number): Promise<NomenclatureItem> {
    // ── Attempt 1: service ──────────────────────────────────────────────────
    const services = await this.list(patientId, ['service']);
    const serviceItem = services.find((i) => i.isActive !== false) ?? services[0];
    if (serviceItem) return serviceItem;

    // ── Attempt 2: kit (fallback for environments with no standalone services) ─
    const kits = await this.list(patientId, ['kit']);
    const kitItem = kits.find((i) => i.isActive !== false) ?? kits[0];
    if (kitItem) return kitItem;

    // ── Both empty → critical environment config error ──────────────────────
    throw new CriticalDataMissingError(
      `[NomenclatureService] CriticalDataMissing: No active nomenclature of type 'service' or 'kit' ` +
        `found for patientId=${patientId}. ` +
        `Ensure the environment has at least one active entry in the stock nomenclature catalogue.`,
    );
  }
}
