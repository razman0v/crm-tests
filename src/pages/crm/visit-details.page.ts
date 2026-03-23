import { Page } from '@playwright/test';
import { BasePage } from '../base.page';
import { config } from '../../config/config.interface';
import { DentalChartWidget } from '../components/organisms/dental-chart/dental-chart.widget';
import { TreatmentPlanWidget } from '../components/organisms/treatment-plan/treatment-plan.widget';
import { VisitStatusWidget } from '../components/organisms/visit-status/visit-status.widget';
import { MedicalDiaryWidget } from '../components/organisms/medical-diary/medical-diary.widget';

/**
 * VisitDetailsPage — CRM Composition Page
 *
 * Assembles all organism-level widgets into a single page object that
 * represents the full Visit Details view. Each widget is a self-contained
 * section; this page object is the single entry point used by E2E tests.
 *
 * Widget properties unblock the E2E flow as follows:
 * - `visitStatus`    — drive the visit life-cycle (arrived → started → completed)
 * - `dentalChart`    — select teeth and record conditions without leaving the page
 * - `treatmentPlan`  — add catalog services and push them into the active visit
 * - `medicalDiary`   — persist clinical notes tied to this visit
 *
 * @example
 * const visitDetails = new VisitDetailsPage(page, config);
 * await visitDetails.goto(visitId);
 * await visitDetails.visitStatus.changeStatus('Начать визит');
 * await visitDetails.dentalChart.selectTooth(16);
 * await visitDetails.dentalChart.markCondition('Кариес');
 * await visitDetails.dentalChart.saveChart();
 * await visitDetails.treatmentPlan.addService('Профессиональная чистка');
 * await visitDetails.treatmentPlan.transferToVisit();
 * await visitDetails.medicalDiary.addNote('Пациент жалуется на боль');
 */
export class VisitDetailsPage extends BasePage {
  /** Manages the visit life-cycle state button. */
  readonly visitStatus: VisitStatusWidget;

  /** Interactive teeth map — tooth selection and condition marking. */
  readonly dentalChart: DentalChartWidget;

  /** Treatment Plan section — adding catalog services and visit transfer. */
  readonly treatmentPlan: TreatmentPlanWidget;

  /** Medical Diary section — free-text clinical notes. */
  readonly medicalDiary: MedicalDiaryWidget;

  constructor(page: Page, config: config) {
    super(page, config);

    this.visitStatus   = new VisitStatusWidget(page);
    this.dentalChart   = new DentalChartWidget(page);
    this.treatmentPlan = new TreatmentPlanWidget(page);
    this.medicalDiary  = new MedicalDiaryWidget(page);
  }

  // ─── Navigation ─────────────────────────────────────────────────────────────

  /**
   * Navigate to an existing visit by its numeric ID or a raw path string.
   *
   * - `goto(1708)`     → /schedule/visits/1708
   * - `goto()`         → /schedule/visits/new
   * - `goto('/other')` → /other (falls through to BasePage.goto)
   *
   * @param visitIdOrPath - Numeric visit ID or explicit path string
   */
  override async goto(visitIdOrPath?: number | string): Promise<void> {
    let path: string;
    if (typeof visitIdOrPath === 'number') {
      path = `/schedule/visits/${visitIdOrPath}`;
    } else if (typeof visitIdOrPath === 'string' && visitIdOrPath.length > 0) {
      path = visitIdOrPath;
    } else {
      path = '/schedule/visits/new';
    }

    this.logger.debug('VisitDetailsPage: navigating', { visitIdOrPath, path });

    try {
      await super.goto(path);
      this.logger.info('VisitDetailsPage: ✅ navigation successful', { path });
    } catch (error) {
      this.logger.error('VisitDetailsPage: navigation failed', {
        error: String(error),
        path,
      });
      throw error;
    }
  }
}
