import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { findClassSession, getSessionTimer } from '../utils/classSessionTimer';

export class ClassTimerService extends BaseModuleService {
  static getSession(cls, now) {
    return findClassSession(cls, now);
  }

  static getTimer(cls, now) {
    return getSessionTimer(this.getSession(cls, now), now);
  }
}
