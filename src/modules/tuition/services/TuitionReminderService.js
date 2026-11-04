import { BaseModuleService } from '../../../shared/services/BaseModuleService';

/**
 * Sub-Feature Class 3 (Tuition Module): Tuition Notification & Reminder Builder
 */
export class TuitionReminderService extends BaseModuleService {
  static buildReminderMessage(student) {
    return `Đã gửi thông báo nhắc đóng học phí qua Zalo/SMS tới phụ huynh ${student.parentName} (${student.phone}) của học viên ${student.name}!`;
  }
}

