import React from 'react';
import { Tag, Space } from 'antd';
import { VideoCameraOutlined } from '@ant-design/icons';

/**
 * SVG Icons chính hãng cho các nền tảng phòng học trực tuyến
 */
export const GoogleMeetIcon = ({ size = 16, style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ verticalAlign: 'middle', display: 'inline-block', flexShrink: 0, ...style }}
  >
    <path d="M12 7V17L18 21V3L12 7Z" fill="#00832D" />
    <path d="M1 5.5V18.5C1 19.88 2.12 21 3.5 21H12V3H3.5C2.12 3 1 4.12 1 5.5Z" fill="#0066DA" />
    <path d="M18 8.5L23 4.5V19.5L18 15.5V8.5Z" fill="#E94235" />
    <path d="M12 17H18V21L12 17Z" fill="#2684FC" />
    <path d="M12 3L18 7V3H12Z" fill="#00AC47" />
    <path d="M1 18.5C1 19.88 2.12 21 3.5 21H12V17H1V18.5Z" fill="#00AC47" />
    <path d="M12 3H3.5C2.12 3 1 4.12 1 5.5V7H12V3Z" fill="#FFBA00" />
  </svg>
);

export const ZoomIcon = ({ size = 16, style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ verticalAlign: 'middle', display: 'inline-block', flexShrink: 0, ...style }}
  >
    <rect width="24" height="24" rx="5" fill="#2D8CFF" />
    <path
      d="M5 8.5C5 7.67157 5.67157 7 6.5 7H13.5C14.3284 7 15 7.67157 15 8.5V15.5C15 16.3284 14.3284 17 13.5 17H6.5C5.67157 17 5 16.3284 5 15.5V8.5Z"
      fill="white"
    />
    <path
      d="M16 10.2L18.8 8.1C19.1 7.87 19.5 8.08 19.5 8.46V15.54C19.5 15.92 19.1 16.13 18.8 15.9L16 13.8V10.2Z"
      fill="white"
    />
  </svg>
);

export const TeamsIcon = ({ size = 16, style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ verticalAlign: 'middle', display: 'inline-block', flexShrink: 0, ...style }}
  >
    <rect width="24" height="24" rx="5" fill="#505AC9" />
    <path
      d="M14.5 9.5C15.3284 9.5 16 8.82843 16 8C16 7.17157 15.3284 6.5 14.5 6.5C13.6716 6.5 13 7.17157 13 8C13 8.82843 13.6716 9.5 14.5 9.5Z"
      fill="white"
    />
    <path
      d="M17.5 10.5H13C12.4477 10.5 12 10.9477 12 11.5V15.5C12 16.0523 12.4477 16.5 13 16.5H17.5C18.0523 16.5 18.5 16.0523 18.5 15.5V11.5C18.5 10.9477 18.0523 10.5 17.5 10.5Z"
      fill="white"
    />
    <circle cx="8.5" cy="7.5" r="2" fill="#E1DFDD" />
    <rect x="5" y="10.5" width="7" height="7" rx="1" fill="#FFFFFF" />
  </svg>
);

/**
 * Tự động nhận diện nền tảng phòng học từ URL
 */
export const detectMeetingPlatform = (url = '') => {
  const str = String(url || '').trim().toLowerCase();

  if (str.includes('meet.google.com')) {
    return {
      type: 'google_meet',
      label: 'Google Meet',
      badgeColor: '#0f9d58',
      textColor: '#0f5132',
      bgColor: '#e8f5e9',
      borderColor: '#a3cfbb',
      icon: <GoogleMeetIcon size={16} />,
      iconSmall: <GoogleMeetIcon size={14} />,
    };
  }

  if (str.includes('zoom.us') || str.includes('zoom.com')) {
    return {
      type: 'zoom',
      label: 'Zoom Meeting',
      badgeColor: '#2d8cff',
      textColor: '#084298',
      bgColor: '#cfe2ff',
      borderColor: '#9ec5fe',
      icon: <ZoomIcon size={16} />,
      iconSmall: <ZoomIcon size={14} />,
    };
  }

  if (str.includes('teams.microsoft.com') || str.includes('teams.live.com')) {
    return {
      type: 'teams',
      label: 'Microsoft Teams',
      badgeColor: '#6264a7',
      textColor: '#432874',
      bgColor: '#f3e8fd',
      borderColor: '#d8b4fe',
      icon: <TeamsIcon size={16} />,
      iconSmall: <TeamsIcon size={14} />,
    };
  }

  return {
    type: 'camera',
    label: 'Phòng Trực Tuyến',
    badgeColor: '#1890ff',
    textColor: '#0958d9',
    bgColor: '#e6f4ff',
    borderColor: '#91caff',
    icon: <VideoCameraOutlined style={{ color: '#1890ff' }} />,
    iconSmall: <VideoCameraOutlined style={{ color: '#1890ff', fontSize: 13 }} />,
  };
};

/**
 * Component Huy hiệu Nền Tảng Phòng Học
 */
export const MeetingPlatformBadge = ({ url = '', showLabel = true, size = 'default' }) => {
  const platform = detectMeetingPlatform(url);

  return (
    <Tag
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        backgroundColor: platform.bgColor,
        borderColor: platform.borderColor,
        color: platform.textColor,
        fontWeight: 600,
        borderRadius: 6,
        padding: size === 'small' ? '1px 6px' : '2px 8px',
        fontSize: size === 'small' ? 11 : 12,
        margin: 0,
      }}
    >
      {size === 'small' ? platform.iconSmall : platform.icon}
      {showLabel && <span>{platform.label}</span>}
    </Tag>
  );
};

