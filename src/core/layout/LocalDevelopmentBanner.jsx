import React from 'react';
import { FIREBASE_RUNTIME_ENV } from '../services/firebase';

/** Visible only on localhost to make the isolated test environment unmistakable. */
export const LocalDevelopmentBanner = () => {
  if (FIREBASE_RUNTIME_ENV === 'production') return null;

  const isEmulator = FIREBASE_RUNTIME_ENV === 'local-emulator';

  return (
    <div className="lak-local-development-banner" role="status">
      {isEmulator
        ? 'MÔI TRƯỜNG GIẢ LẬP CỤC BỘ • DỮ LIỆU KIỂM THỬ'
        : 'MÔI TRƯỜNG PHÁT TRIỂN • DỮ LIỆU DEV'}
    </div>
  );
};
