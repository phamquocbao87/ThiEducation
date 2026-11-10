export const TUITION_STATUS = {
  PAID: 'PAID',
  UNPAID: 'UNPAID',
  OVERDUE: 'OVERDUE',
};

export const TUITION_STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'PAID', label: 'Đã Nộp' },
  { value: 'UNPAID', label: 'Chưa Nộp' },
  { value: 'OVERDUE', label: 'Quá Hạn' },
];

export const TUITION_STATUS_LABELS = {
  PAID: { text: 'ĐÃ NỘP', color: 'green' },
  UNPAID: { text: 'CHƯA NỘP', color: 'orange' },
  OVERDUE: { text: 'QUÁ HẠN', color: 'red' },
};

export const getTuitionStatusMeta = (status, isEnglish = false) => {
  switch (status) {
    case TUITION_STATUS.PAID:
      return { text: isEnglish ? 'PAID' : 'ĐÃ NỘP', color: 'green' };
    case TUITION_STATUS.UNPAID:
      return { text: isEnglish ? 'UNPAID' : 'CHƯA NỘP', color: 'orange' };
    case TUITION_STATUS.OVERDUE:
      return { text: isEnglish ? 'OVERDUE' : 'QUÁ HẠN', color: 'red' };
    default:
      return { text: status, color: 'default' };
  }
};

export const getTuitionStatusOptions = (isEnglish = false) => [
  { value: 'ALL', label: isEnglish ? 'All Statuses' : 'Tất cả trạng thái' },
  { value: 'PAID', label: isEnglish ? 'Paid' : 'Đã Nộp' },
  { value: 'UNPAID', label: isEnglish ? 'Unpaid' : 'Chưa Nộp' },
  { value: 'OVERDUE', label: isEnglish ? 'Overdue' : 'Quá Hạn' },
];
