import { Page, Locator } from '@playwright/test';
import { logger } from '../../../../utils/logger';
import { InputField } from '../../atoms';

/**
 * MedicalDiary Organism Widget
 *
 * Encapsulates interactions with the Medical Diary (Медицинский дневник) section
 * on the Visit Details page: adding free-text notes and reading existing entries.
 *
 * @example
 * const diary = new MedicalDiaryWidget(page);
 * await diary.addNote('Жалобы на боль в области 16-го зуба');
 * const notes = await diary.getNotes();
 * expect(notes).toContain('Жалобы на боль в области 16-го зуба');
 */
export class MedicalDiaryWidget {
  private readonly page: Page;

  // Root section container
  private readonly root: Locator;

  // Button that opens the note editor
  private readonly addNoteButton: Locator;

  // Textarea / input used when writing a new note
  private readonly noteInput: InputField;

  // Confirm save of the note
  private readonly saveNoteButton: Locator;

  // All rendered note entries in the diary list
  private readonly noteEntries: Locator;

  constructor(page: Page) {
    this.page = page;

    this.root = page.locator(
      '.MedicalDiaryView, [data-testid="medical-diary"]',
    );

    this.addNoteButton = this.root.getByRole('button', {
      name: /Добавить запись|Add note|Добавить/i,
    });

    this.noteInput = new InputField(
      page.getByLabel(/Текст записи|Note text|Заметка/i),
    );

    this.saveNoteButton = page
      .locator('.NoteEditorPanel, [data-testid="note-editor"]')
      .getByRole('button', { name: /Сохранить|Save/i })
      .first();

    // Each note entry in the list
    this.noteEntries = this.root.locator(
      '.DiaryEntry, [data-testid="diary-entry"], .NoteItem',
    );
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Add a new free-text note to the medical diary.
   *
   * Flow: click "Add note" → fill input → save.
   *
   * @param text - Note body text
   */
  async addNote(text: string): Promise<void> {
    logger.info('MedicalDiaryWidget: adding note', { textLength: text.length });

    await this.root.waitFor({ state: 'visible', timeout: 5000 });
    await this.addNoteButton.click();

    await this.noteInput.fill(text);

    await this.saveNoteButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.saveNoteButton.click();

    // Wait for the note to appear in the list
    await this.page.waitForTimeout(300);

    logger.info('MedicalDiaryWidget: ✅ note added');
  }

  /**
   * Retrieve the text content of all diary entries currently visible.
   * Returns an empty array when the diary section has no entries yet.
   *
   * @returns Array of note strings (trimmed)
   */
  async getNotes(): Promise<string[]> {
    logger.debug('MedicalDiaryWidget: reading all notes');

    await this.root.waitFor({ state: 'visible', timeout: 5000 });

    const count = await this.noteEntries.count();
    if (count === 0) {
      logger.debug('MedicalDiaryWidget: no notes found');
      return [];
    }

    const notes: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await this.noteEntries.nth(i).textContent()) ?? '';
      notes.push(text.trim());
    }

    logger.info('MedicalDiaryWidget: notes retrieved', { count: notes.length });
    return notes;
  }
}
