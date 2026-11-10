import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import viVN from 'antd/locale/vi_VN';
import { useTranslation } from 'react-i18next';
import i18n, {
  STORAGE_LANG_KEY,
  DEFAULT_LANGUAGE,
  VI_TO_EN_UI_LABELS,
  EN_TO_VI_UI_LABELS,
} from '../i18n/i18n';

const LanguageContext = createContext();

/**
 * Các CSS Selector CHỈ thuộc về Label giao diện (UI Labels: tiêu đề cột bảng, tiêu đề thẻ, nút bấm, nhãn trạng thái).
 * Tuyệt đối KHÔNG quét vào nội dung dữ liệu người dùng (td nội dung bảng, input value, textarea, tên học viên/giáo viên).
 */
const UI_LABEL_SELECTORS = [
  '.ant-table-column-title',
  '.ant-statistic-title',
  '.ant-card-head-title span',
  '.ant-tabs-tab-btn span',
  '.ant-descriptions-item-label',
  '.ant-form-item-label > label',
  '.ant-btn > span',
  '.ant-tag',
  '.ant-badge-status-text',
  '.ant-modal-title',
  '.ant-drawer-title',
  '.ant-list-header strong',
].join(', ');

export const LanguageProvider = ({ children }) => {
  const { t } = useTranslation();
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem(STORAGE_LANG_KEY) || DEFAULT_LANGUAGE;
  });

  // Khóa triệt để tính năng Google Translate / Trình duyệt tự dịch đè lên i18n
  const syncHtmlLangAttributes = useCallback((lang) => {
    if (typeof document !== 'undefined') {
      const rootHtml = document.documentElement;
      rootHtml.lang = lang;
      rootHtml.setAttribute('translate', 'no');
      rootHtml.classList.add('notranslate');

      if (document.body) {
        document.body.setAttribute('translate', 'no');
        document.body.classList.add('notranslate');
      }

      const rootDiv = document.getElementById('root');
      if (rootDiv) {
        rootDiv.setAttribute('translate', 'no');
        rootDiv.classList.add('notranslate');
      }
    }
  }, []);

  const setLanguage = useCallback((lang) => {
    const normalized = lang === 'vi' ? 'vi' : 'en';
    setLanguageState(normalized);
    localStorage.setItem(STORAGE_LANG_KEY, normalized);
    i18n.changeLanguage(normalized);
    syncHtmlLangAttributes(normalized);
  }, [syncHtmlLangAttributes]);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'vi' : 'en');
  }, [language, setLanguage]);

  const translateLabel = useCallback(
    (labelStr) => {
      if (!labelStr || typeof labelStr !== 'string') return labelStr;
      const trimmed = labelStr.trim();
      if (language === 'en') {
        return VI_TO_EN_UI_LABELS[trimmed] || labelStr;
      }
      return EN_TO_VI_UI_LABELS[trimmed] || labelStr;
    },
    [language]
  );

  // Đồng bộ an toàn các UI Label tĩnh (Chỉ chạy khi đổi ngôn ngữ hoặc chuyển tab/click, tuyệt đối không dùng MutationObserver gây vòng lặp)
  useEffect(() => {
    syncHtmlLangAttributes(language);

    const applyUiLabelLocalization = () => {
      const dictionary = language === 'en' ? VI_TO_EN_UI_LABELS : EN_TO_VI_UI_LABELS;
      const elements = document.querySelectorAll(UI_LABEL_SELECTORS);

      elements.forEach((el) => {
        if (el.children.length === 0) {
          const rawText = el.textContent?.trim();
          if (!rawText) return;

          const targetText = dictionary[rawText];
          // Chỉ cập nhật khi chuỗi đích khác chuỗi hiện tại để tránh render thừa
          if (targetText && targetText !== rawText) {
            el.textContent = targetText;
          } else if (language === 'en') {
            if (rawText.startsWith('Cắt & Đẩy Năm ') && rawText.endsWith(' Sang Drive')) {
              const year = rawText.replace('Cắt & Đẩy Năm ', '').replace(' Sang Drive', '');
              const nextStr = `Cut-off & Archive Year ${year} to Drive`;
              if (el.textContent !== nextStr) el.textContent = nextStr;
            }
          } else if (language === 'vi') {
            if (rawText.startsWith('Cut-off & Archive Year ') && rawText.endsWith(' to Drive')) {
              const year = rawText
                .replace('Cut-off & Archive Year ', '')
                .replace(' to Drive', '');
              const nextStr = `Cắt & Đẩy Năm ${year} Sang Drive`;
              if (el.textContent !== nextStr) el.textContent = nextStr;
            }
          }
        }
      });
    };

    // Chạy ngay khi mount hoặc đổi ngôn ngữ + sau 1 nhịp render ngắn khi chuyển trang/mở modal
    applyUiLabelLocalization();
    const timer = setTimeout(applyUiLabelLocalization, 120);

    const handleUserInteraction = () => {
      requestAnimationFrame(() => {
        setTimeout(applyUiLabelLocalization, 60);
      });
    };

    window.addEventListener('click', handleUserInteraction, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleUserInteraction);
    };
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        isEnglish: language === 'en',
        setLanguage,
        toggleLanguage,
        t,
        translateLabel,
      }}
    >
      <ConfigProvider locale={language === 'en' ? enUS : viVN}>{children}</ConfigProvider>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
