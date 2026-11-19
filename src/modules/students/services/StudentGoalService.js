import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { db, IS_FIREBASE_ENABLED } from '../../../core/services/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';

/**
 * Service quản lý Mục tiêu học tập (Goals & Milestones) và Học bạ điện tử học viên
 * Hỗ trợ đa khóa học (McGraw-Hill Wonders, Spoken English, Cambridge Test Prep...)
 */
export class StudentGoalService extends BaseModuleService {
  /**
   * Khung mục tiêu mẫu chuẩn theo từng cấp độ khóa học
   */
  static getDefaultGoalTemplate(courseLevel = 'Wonders G1', classObj = {}) {
    const lvl = (courseLevel || '').toLowerCase();
    const totalSessions = classObj.totalSessions || 36;
    const s1 = Math.round(totalSessions * 0.33);
    const s2 = Math.round(totalSessions * 0.67);
    const s3 = totalSessions;

    if (lvl.includes('starter') || lvl.includes('mover') || lvl.includes('flyer') || lvl.includes('cambridge')) {
      return {
        templateType: 'CAMBRIDGE_PREP',
        courseLevel: courseLevel || 'Cambridge Starters',
        targetCefr: 'Pre-A1 / A1',
        title: 'Chinh Phục Chứng Chỉ Quốc Tế Cambridge',
        description: 'Rèn luyện phản xạ đề thi 3 phần: Listening, Reading & Writing, Speaking với Giáo viên bản xứ.',
        totalSessions,
        milestones: [
          { id: 'M1', sessionIndex: s1, title: 'Làm chủ từ vựng & ngữ âm đề thi phần 1', targetSession: s1, status: 'IN_PROGRESS' },
          { id: 'M2', sessionIndex: s2, title: 'Đạt từ 12/15 Khiên (Shields) bài thi thử giữa kỳ', targetSession: s2, status: 'PENDING' },
          { id: 'M3', sessionIndex: s3, title: 'Hoàn thành bài thi Speaking 4 phần phản xạ tự tin', targetSession: s3, status: 'PENDING' },
        ],
        weights: { evaluation: 0.40, attendance: 0.25, homework: 0.20, sessionProgress: 0.15 },
      };
    }

    if (lvl.includes('spoken') || lvl.includes('giao tiep') || lvl.includes('fluency')) {
      return {
        templateType: 'SPOKEN_FLUENCY',
        courseLevel: courseLevel || 'Spoken English',
        targetCefr: 'A1 Fluency',
        title: 'Giao Tiếp Phản Xạ Tự Nhiên & Thuyết Trình Tiếng Anh',
        description: 'Tự tin nói liên tục, phát âm chuẩn ngữ điệu và tương tác phản xạ 100% với Giáo viên bản xứ.',
        totalSessions,
        milestones: [
          { id: 'M1', sessionIndex: s1, title: 'Tự tin nói 1 phút theo tranh không ngập ngừng', targetSession: s1, status: 'IN_PROGRESS' },
          { id: 'M2', sessionIndex: s2, title: 'Thuyết trình 2 phút chủ đề gia đình & sở thích', targetSession: s2, status: 'PENDING' },
          { id: 'M3', sessionIndex: s3, title: 'Tranh biện phản xạ theo cặp với bạn cùng lớp', targetSession: s3, status: 'PENDING' },
        ],
        weights: { evaluation: 0.45, attendance: 0.30, homework: 0.15, sessionProgress: 0.10 },
      };
    }

    // Mặc định: Chuẩn McGraw-Hill Wonders ELA (Mỹ)
    return {
      templateType: 'WONDERS_ELA',
      courseLevel: courseLevel || 'McGraw-Hill Wonders G1',
      targetCefr: lvl.includes('g2') ? 'A2' : lvl.includes('g3') ? 'B1' : 'A1',
      title: `Chinh Phục Toàn Diện McGraw-Hill ${courseLevel || 'Wonders G1'}`,
      description: 'Làm chủ Phonics ngữ âm, đọc hiểu câu chuyện và tự tin tương tác Breakout Rooms với Giáo viên bản xứ.',
      totalSessions,
      milestones: [
        { id: 'M1', sessionIndex: s1, title: 'Làm chủ âm đuôi /s/, /ed/ & 60 từ vựng Unit 1-2', targetSession: s1, status: 'IN_PROGRESS' },
        { id: 'M2', sessionIndex: s2, title: 'Đọc hiểu trôi chảy truyện ngắn Wonders & trả lời câu hỏi', targetSession: s2, status: 'PENDING' },
        { id: 'M3', sessionIndex: s3, title: 'Hoàn thành bài đánh giá tổng kết cuối khóa đạt ≥ 85%', targetSession: s3, status: 'PENDING' },
      ],
      weights: { evaluation: 0.40, attendance: 0.25, homework: 0.20, sessionProgress: 0.15 },
    };
  }

  /**
   * Đọc mục tiêu của học viên cho 1 lớp học cụ thể (hoặc tự động khởi tạo nếu chưa có)
   */
  static async getStudentGoalForClass(studentId, classObj = {}) {
    const classId = classObj.id || classObj.classId || 'DEFAULT_CLASS';
    const goalId = `GOAL_${studentId}_${classId}`;

    if (IS_FIREBASE_ENABLED && db) {
      try {
        const goalRef = doc(db, 'student_goals', goalId);
        const snap = await getDoc(goalRef);
        if (snap.exists()) {
          return { id: snap.id, ...snap.data() };
        }
      } catch (e) {
        console.warn('[StudentGoalService] Lỗi đọc student_goals:', e);
      }
    }

    // Nếu chưa có, tự sinh goal mặc định từ template của khóa học
    const template = this.getDefaultGoalTemplate(classObj.courseLevel || classObj.level || classObj.name, classObj);
    const newGoal = {
      id: goalId,
      studentId,
      classId,
      className: classObj.name || classId,
      courseId: classObj.courseId || '',
      courseLevel: template.courseLevel,
      targetCefr: template.targetCefr,
      title: template.title,
      description: template.description,
      totalSessions: template.totalSessions,
      milestones: template.milestones,
      weights: template.weights,
      parentAspirations: ['🗣️ Tự tin giao tiếp với người nước ngoài', '📚 Nắm vững kiến thức trên lớp'],
      teacherNote: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Tự động lưu ngầm lên Firestore nếu kết nối sẵn sàng
    if (IS_FIREBASE_ENABLED && db) {
      try {
        await setDoc(doc(db, 'student_goals', goalId), newGoal);
      } catch (e) {
        console.warn('[StudentGoalService] Lỗi lưu khởi tạo student_goals:', e);
      }
    }

    return newGoal;
  }

  /**
   * Tính toán điểm tiến độ và trạng thái hoàn thành mục tiêu thời gian thực
   * Dựa trên 4 nguồn: Lịch sử đánh giá (session_evaluations), Chuyên cần, Bài tập, Tiến độ buổi
   */
  static calculateGoalProgress(goal, sessionEvaluations = [], attendanceLogs = {}) {
    const weights = goal.weights || { evaluation: 0.40, attendance: 0.25, homework: 0.20, sessionProgress: 0.15 };
    const totalSessions = goal.totalSessions || 36;

    // 1. Phân tích điểm đánh giá sư phạm từ session_evaluations
    let evalScore = 80; // Mặc định 80% nếu chưa có nhiều buổi
    let starsAvg = 5.0;
    let skillScores = { phonics: 4.8, vocabulary: 4.5, listening: 4.6, engagement: 4.8 };
    let homeworkCompletedCount = 0;
    let completedSessionsCount = 0;

    if (sessionEvaluations.length > 0) {
      completedSessionsCount = sessionEvaluations.length;
      let totalStars = 0;
      sessionEvaluations.forEach((ev) => {
        totalStars += ev.stars || ev.rating || 5;
        if (ev.homeworkStatus === 'done' || ev.homeworkStatus === 'completed' || ev.hasHomework !== false) {
          homeworkCompletedCount++;
        }
      });
      starsAvg = Math.round((totalStars / sessionEvaluations.length) * 10) / 10;
      evalScore = Math.min(100, Math.round((starsAvg / 5.0) * 100));
    }

    // 2. Phân tích chuyên cần
    const attendanceRate = attendanceLogs.attendanceRate !== undefined ? attendanceLogs.attendanceRate : 96;

    // 3. Phân tích bài tập về nhà
    const homeworkRate = completedSessionsCount > 0
      ? Math.round((homeworkCompletedCount / completedSessionsCount) * 100)
      : 85;

    // 4. Tiến độ số buổi đã học
    const sessionProgress = Math.min(100, Math.round((completedSessionsCount / totalSessions) * 100));

    // Tổng hợp điểm tiến độ theo công thức chuẩn
    const totalProgress = Math.min(
      100,
      Math.round(
        weights.evaluation * evalScore +
        weights.attendance * attendanceRate +
        weights.homework * homeworkRate +
        weights.sessionProgress * sessionProgress
      )
    );

    // Xác định trạng thái tiến độ
    let status = 'ON_TRACK';
    let statusLabel = 'Đúng Tiến Độ';
    let statusColor = 'blue';

    if (totalProgress >= 80 && starsAvg >= 4.5) {
      status = 'AHEAD_OF_TRACK';
      statusLabel = 'Vượt Tiến Độ';
      statusColor = 'success';
    } else if (totalProgress < 60 || starsAvg < 3.5 || attendanceRate < 80) {
      status = 'AT_RISK';
      statusLabel = 'Cần Hỗ Trợ';
      statusColor = 'error';
    }

    return {
      totalProgress,
      evalScore,
      starsAvg,
      attendanceRate,
      homeworkRate,
      sessionProgress,
      completedSessionsCount,
      totalSessions,
      status,
      statusLabel,
      statusColor,
      skillScores,
    };
  }

  /**
   * Cập nhật trạng thái một Milestone của học viên
   */
  static async updateMilestoneStatus(goalId, milestoneId, newStatus, actorUser = {}) {
    if (!goalId || !milestoneId) return;

    if (IS_FIREBASE_ENABLED && db) {
      try {
        const goalRef = doc(db, 'student_goals', goalId);
        const snap = await getDoc(goalRef);
        if (snap.exists()) {
          const data = snap.data();
          const milestones = (data.milestones || []).map((m) => {
            if (m.id === milestoneId) {
              return {
                ...m,
                status: newStatus,
                updatedBy: actorUser.name || actorUser.id || 'Academic',
                achievedDate: newStatus === 'COMPLETED' ? new Date().toLocaleDateString('vi-VN') : undefined,
              };
            }
            return m;
          });
          await updateDoc(goalRef, { milestones, updatedAt: new Date().toISOString() });
        }
      } catch (err) {
        console.error('[StudentGoalService] Lỗi updateMilestoneStatus:', err);
        throw err;
      }
    }
  }

  /**
   * Cập nhật nguyện vọng / mong muốn học tập của Phụ huynh & Học viên
   */
  static async updateAspirations(goalId, aspirations = []) {
    if (!goalId) return;
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const goalRef = doc(db, 'student_goals', goalId);
        await updateDoc(goalRef, { parentAspirations: aspirations, updatedAt: new Date().toISOString() });
      } catch (err) {
        console.error('[StudentGoalService] Lỗi updateAspirations:', err);
        throw err;
      }
    }
  }
}
