import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { SESSION_STATUS } from '../models/schedules.model';

/**
 * Sub-Feature Class 3 (Schedules Module): Teacher Classroom Check-In Service
 * Allows teachers (and academic coordinators) to check in to a live session.
 */
export class TeacherCheckInService extends BaseModuleService {
  static checkInSession(timetable, slotId) {
    return timetable.map((slot) =>
      slot.id === slotId ? { ...slot, status: SESSION_STATUS.CHECKED_IN } : slot
    );
  }
}

