import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { DriveStorageService } from '../../../core/services/DriveStorageService';

export class ExerciseMediaService extends BaseModuleService {
  static async upload(file, exerciseId, purpose = 'author-media') {
    if (!file) return null;
    const result = await DriveStorageService.uploadFile(file, {
      folderPath: `04_STUDENT_HOMEWORKS_PROFILES/exercises/2026/${exerciseId}/${purpose}`,
      tag: 'exercise_media', purpose, key: exerciseId, title: file.name,
    });
    const isImage = String(file.type || '').startsWith('image/');
    const fileId = result.fileId || result.id || '';
    const driveViewUrl = result.driveUrl || (fileId ? `https://drive.google.com/file/d/${fileId}/view` : '');
    const drivePreviewUrl = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : '';
    const playableUrl = isImage
      ? (result.cdnUrl || (fileId ? `https://lh3.googleusercontent.com/d/${fileId}=s800` : result.driveUrl || ''))
      : (drivePreviewUrl || result.downloadUrl || result.driveUrl || '');
    return {
      id: fileId,
      name: file.name,
      mimeType: file.type,
      url: playableUrl,
      driveUrl: driveViewUrl,
      embedUrl: drivePreviewUrl,
    };
  }
}
