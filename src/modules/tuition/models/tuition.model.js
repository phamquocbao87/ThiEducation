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

