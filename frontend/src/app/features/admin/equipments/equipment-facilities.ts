import { UiSelectOption } from '../../../shared/ui';
import { EquipmentRow, Facility } from './equipments.models';

/** Build distinct facility (service) options from facility or equipment rows. */
export function toFacilityOptions(rows: Array<EquipmentRow | Facility>): UiSelectOption[] {
  const seen = new Map<number, string>();

  for (const row of rows) {
    const id = 'facilityId' in row ? row.facilityId : row.id;
    const name = row.facilityName?.trim();

    if (name && !seen.has(id)) {
      seen.set(id, name);
    }
  }

  return [...seen].map(([id, name]) => ({ value: String(id), label: name }));
}
