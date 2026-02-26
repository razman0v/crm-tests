/**
 * API Endpoints Constants
 * Centralized, typed enum of all API routes to prevent string duplication
 * and enable IDE autocomplete across all services.
 *
 * Benefits:
 * - Single source of truth for API URLs
 * - IDE autocomplete support (vs hardcoded strings)
 * - Easy bulk updates if API structure changes
 * - Type-safe path composition for parameterized routes
 *
 * Usage:
 * ❌ POST `'/api/v1/patients'`
 * ✅ POST `API_ENDPOINTS.PATIENTS.CREATE`
 */

export const API_ENDPOINTS = {
  /**
   * Patient Management Endpoints
   */
  PATIENTS: {
    /**
     * POST /api/v1/patients
     * Create a new patient
     * Request: PatientPayload
     * Response: PatientResponse
     */
    CREATE: '/api/v1/patients',

    /**
     * GET /api/v1/patients/:id
     * Retrieve patient by ID
     * Response: PatientResponse
     */
    GET_BY_ID: (id: string | number) => `/api/v1/patients/${id}`,

    /**
     * GET /api/v1/patients
     * List all patients with pagination
     * Query: { page?, limit?, search? }
     * Response: { data: PatientResponse[], total: number }
     */
    LIST: '/api/v1/patients',

    /**
     * PUT /api/v1/patients/:id
     * Update patient
     * Request: Partial<PatientPayload>
     * Response: PatientResponse
     */
    UPDATE: (id: string | number) => `/api/v1/patients/${id}`,

    /**
     * DELETE /api/v1/patients/:id
     * Delete patient
     * Response: { success: boolean }
     */
    DELETE: (id: string | number) => `/api/v1/patients/${id}`,
  },

  /**
   * Schedule / Shift Management Endpoints
   */
  SCHEDULE: {
    /**
     * POST /api/v1/schedule/shifts
     * Create a new shift for an employee
     * Request: ShiftPayload
     * Response: ShiftResponse
     */
    CREATE_SHIFT: '/api/v1/schedule/shifts',

    /**
     * GET /api/v1/schedule/shifts
     * List shifts with optional filtering
     * Query: { employee_id?, from?, to?, clinic_id? }
     * Response: ShiftResponse[]
     */
    LIST_SHIFTS: '/api/v1/schedule/shifts',

    /**
     * GET /api/v1/schedule/shifts/:id
     * Retrieve shift details
     * Response: ShiftResponse
     */
    GET_SHIFT: (id: string | number) => `/api/v1/schedule/shifts/${id}`,

    /**
     * PUT /api/v1/schedule/shifts/:id
     * Update shift
     * Request: Partial<ShiftPayload>
     * Response: ShiftResponse
     */
    UPDATE_SHIFT: (id: string | number) => `/api/v1/schedule/shifts/${id}`,

    /**
     * DELETE /api/v1/schedule/shifts/:id
     * Delete shift
     * Response: { success: boolean }
     */
    DELETE_SHIFT: (id: string | number) => `/api/v1/schedule/shifts/${id}`,
  },

  /**
   * Branch / Clinic Management Endpoints
   */
  BRANCHES: {
    /**
     * POST /api/v1/branches
     * Create a new branch/clinic
     * Request: BranchPayload
     * Response: BranchResponse
     */
    CREATE: '/api/v1/branches',

    /**
     * GET /api/v1/branches
     * List all branches
     * Query: { company_id? }
     * Response: BranchResponse[]
     */
    LIST: '/api/v1/branches',

    /**
     * GET /api/v1/branches/:id
     * Retrieve branch details
     * Response: BranchResponse
     */
    GET_BY_ID: (id: string | number) => `/api/v1/branches/${id}`,

    /**
     * PUT /api/v1/branches/:id
     * Update branch
     * Request: Partial<BranchPayload>
     * Response: BranchResponse
     */
    UPDATE: (id: string | number) => `/api/v1/branches/${id}`,

    /**
     * GET /api/v1/branches/:id/cabinets
     * List cabinets in branch
     * Response: { cabinets: CabinetResponse[] }
     */
    GET_CABINETS: (branchId: string | number) => `/api/v1/branches/${branchId}/cabinets`,
  },

  /**
   * Employee / Doctor Management Endpoints
   */
  EMPLOYEES: {
    /**
     * POST /api/v1/employees
     * Create a new employee/doctor
     * Request: EmployeePayload
     * Response: EmployeeResponse
     */
    CREATE: '/api/v1/employees',

    /**
     * GET /api/v1/employees
     * List employees with optional filtering
     * Query: { branch_id?, type?, status? }
     * Response: EmployeeResponse[]
     */
    LIST: '/api/v1/employees',

    /**
     * GET /api/v1/employees/:id
     * Retrieve employee details
     * Response: EmployeeResponse
     */
    GET_BY_ID: (id: string | number) => `/api/v1/employees/${id}`,

    /**
     * PUT /api/v1/employees/:id
     * Update employee
     * Request: Partial<EmployeePayload>
     * Response: EmployeeResponse
     */
    UPDATE: (id: string | number) => `/api/v1/employees/${id}`,

    /**
     * GET /api/v1/employees/:id/specializations
     * Retrieve specializations for an employee
     * Response: SpecializationResponse[]
     */
    GET_SPECIALIZATIONS: (id: string | number) =>
      `/api/v1/employees/${id}/specializations`,
  },

  /**
   * Visit Management Endpoints
   */
  VISITS: {
    /**
     * POST /api/v1/visits
     * Create a new visit
     * Request: VisitPayload
     * Response: VisitResponse
     */
    CREATE: '/api/v1/visits',

    /**
     * GET /api/v1/visits
     * List visits with optional filtering
     * Query: { patient_id?, employee_id?, from?, to?, status? }
     * Response: VisitResponse[]
     */
    LIST: '/api/v1/visits',

    /**
     * GET /api/v1/visits/:id
     * Retrieve visit details
     * Response: VisitResponse
     */
    GET_BY_ID: (id: string | number) => `/api/v1/visits/${id}`,

    /**
     * PUT /api/v1/visits/:id
     * Update visit
     * Request: Partial<VisitPayload>
     * Response: VisitResponse
     */
    UPDATE: (id: string | number) => `/api/v1/visits/${id}`,

    /**
     * PUT /api/v1/visits/:id/status
     * Change visit status (e.g., scheduled → completed)
     * Request: { status: VisitStatus }
     * Response: VisitResponse
     */
    CHANGE_STATUS: (id: string | number) => `/api/v1/visits/${id}/status`,

    /**
     * GET /api/v1/visits/:id/dental-chart
     * Retrieve dental chart data for a visit
     * Response: { teeth: ToothResponse[], conditions: DiagnosisResponse[] }
     */
    GET_DENTAL_CHART: (visitId: string | number) =>
      `/api/v1/visits/${visitId}/dental-chart`,

    /**
     * PUT /api/v1/visits/:id/dental-chart
     * Update dental chart (tooth conditions, diagnoses)
     * Request: { teeth: ToothUpdate[], conditions: DiagnosisUpdate[] }
     * Response: { teeth: ToothResponse[], conditions: DiagnosisResponse[] }
     */
    UPDATE_DENTAL_CHART: (visitId: string | number) =>
      `/api/v1/visits/${visitId}/dental-chart`,

    /**
     * GET /api/v1/visits/:id/treatment-plan
     * Retrieve treatment plan for a visit
     * Response: TreatmentPlanResponse[]
     */
    GET_TREATMENT_PLAN: (visitId: string | number) =>
      `/api/v1/visits/${visitId}/treatment-plan`,

    /**
     * POST /api/v1/visits/:id/treatment-plan
     * Add service to treatment plan
     * Request: { service_id: string }
     * Response: TreatmentPlanResponse
     */
    ADD_TREATMENT: (visitId: string | number) =>
      `/api/v1/visits/${visitId}/treatment-plan`,

    /**
     * DELETE /api/v1/visits/:id/treatment-plan/:serviceId
     * Remove service from treatment plan
     * Response: { success: boolean }
     */
    REMOVE_TREATMENT: (visitId: string | number, serviceId: string) =>
      `/api/v1/visits/${visitId}/treatment-plan/${serviceId}`,
  },

  /**
   * Glossary / Reference Data Endpoints
   */
  GLOSSARY: {
    /**
     * GET /api/v1/glossary/specializations
     * List all medical specializations
     * Response: SpecializationResponse[]
     */
    SPECIALIZATIONS: '/api/v1/glossary/specializations',

    /**
     * GET /api/v1/glossary/specializations/:id
     * Retrieve specialization by ID
     * Response: SpecializationResponse
     */
    GET_SPECIALIZATION: (id: string | number) =>
      `/api/v1/glossary/specializations/${id}`,

    /**
     * GET /api/v1/glossary/job-positions
     * List all job positions (Doctor, Hygienist, Assistant, etc.)
     * Response: JobPositionResponse[]
     */
    JOB_POSITIONS: '/api/v1/glossary/job-positions',

    /**
     * GET /api/v1/glossary/job-positions/:id
     * Retrieve job position by ID
     * Response: JobPositionResponse
     */
    GET_JOB_POSITION: (id: string | number) =>
      `/api/v1/glossary/job-positions/${id}`,

    /**
     * GET /api/v1/glossary/medical-job-positions
     * List medical job positions (Doctor type classifications)
     * Response: MedicalJobPositionResponse[]
     */
    MEDICAL_JOB_POSITIONS: '/api/v1/glossary/medical-job-positions',

    /**
     * GET /api/v1/glossary/diagnoses
     * List all possible diagnoses/conditions
     * Query: { category?, search? }
     * Response: DiagnosisResponse[]
     */
    DIAGNOSES: '/api/v1/glossary/diagnoses',

    /**
     * GET /api/v1/glossary/services
     * List all available medical services
     * Query: { specialization_id? }
     * Response: ServiceResponse[]
     */
    SERVICES: '/api/v1/glossary/services',

    /**
     * GET /api/v1/glossary/tooth-conditions
     * List tooth condition types (healthy, caries, missing, etc.)
     * Response: ToothConditionResponse[]
     */
    TOOTH_CONDITIONS: '/api/v1/glossary/tooth-conditions',
  },

  /**
   * Authentication Endpoints
   */
  AUTH: {
    /**
     * POST /auth/login
     * User login
     * Request: { email: string, password: string }
     * Response: { accessToken: string, refreshToken?: string }
     */
    LOGIN: '/auth/login',

    /**
     * POST /auth/logout
     * User logout
     * Response: { success: boolean }
     */
    LOGOUT: '/auth/logout',

    /**
     * POST /auth/refresh
     * Refresh access token
     * Request: { refreshToken: string }
     * Response: { accessToken: string }
     */
    REFRESH: '/auth/refresh',

    /**
     * POST /auth/verify
     * Verify token validity
     * Request: { token: string }
     * Response: { valid: boolean, user: UserResponse }
     */
    VERIFY: '/auth/verify',
  },

  /**
   * Health / Status Endpoints
   */
  HEALTH: {
    /**
     * GET /health
     * Service health check
     * Response: { status: 'ok', timestamp: ISO8601 }
     */
    CHECK: '/health',

    /**
     * GET /health/ready
     * Readiness check (all dependencies available)
     * Response: { ready: boolean, dependencies: {...} }
     */
    READY: '/health/ready',
  },
} as const;

/**
 * Type-safe API endpoint accessor
 * Enables IDE autocomplete and prevents typos in API routes
 *
 * @example
 * // Create patient
 * const url = API_ENDPOINTS.PATIENTS.CREATE;
 * // GET /api/v1/patients/123
 * const url = API_ENDPOINTS.PATIENTS.GET_BY_ID(123);
 * // List visits for patient
 * const url = API_ENDPOINTS.VISITS.LIST + '?patient_id=123';
 */
export type APIEndpoints = typeof API_ENDPOINTS;

/**
 * Helper function to build query parameters for endpoints
 * @param endpoint Base endpoint URL
 * @param params Query parameters object
 * @returns URL with query string appended
 *
 * @example
 * const url = buildEndpointUrl(API_ENDPOINTS.PATIENTS.LIST, { page: 1, limit: 20 });
 * // Result: '/api/v1/patients?page=1&limit=20'
 */
export function buildEndpointUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean>
): string {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }

  const queryString = new URLSearchParams(
    Object.entries(params).reduce(
      (acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      },
      {} as Record<string, string>
    )
  ).toString();

  return `${endpoint}?${queryString}`;
}
