import { ClassroomRealtimeService } from '../../../shared/services/ClassroomRealtimeService';
import { PermissionService } from '../../../core/services/PermissionService';

export class ClassroomService extends ClassroomRealtimeService {
  static canView(user, cls) { return PermissionService.canViewClassroom(user, cls); }
  static canEdit(user, cls) {
    return this.canView(user, cls) && PermissionService.canTakeClassroomAttendance(user.role);
  }
}
