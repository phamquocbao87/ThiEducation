import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Modal, Slider, Button, Space, Typography, Tooltip } from 'antd';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  UndoOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { getCroppedImg } from '../utils/cropImageUtils';

const { Text } = Typography;

/**
 * =====================================================================================
 * AVATAR CROP MODAL (CHUẨN FACEBOOK & GOOGLE PROFILE CROPPER)
 * =====================================================================================
 * 
 * - Khung tròn hiển thị (Circular Crop Mask) mô phỏng 100% Facebook & Google
 * - Kéo / Di chuyển ảnh để định vị trọng tâm khuôn mặt / chi tiết
 * - Thanh trượt Thu phóng (Zoom 1x - 3x) và cuộn chuột
 * - Xoay ảnh (-180° đến +180° hoặc xoay nhanh 90°)
 * - Xuất ra file ảnh đã cắt đúng vị trí người dùng chọn
 */
export const AvatarCropModal = ({
  open,
  imageSrc,
  fileName = 'avatar.jpg',
  initialCropData = null,
  onCancel,
  onApplyCrop,
}) => {
  const [crop, setCrop] = useState(initialCropData?.crop || { x: 0, y: 0 });
  const [zoom, setZoom] = useState(initialCropData?.zoom || 1);
  const [rotation, setRotation] = useState(initialCropData?.rotation || 0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Callback ghi nhận tọa độ pixel khi người dùng kéo/zoom
  const onCropCompleteHandler = useCallback((croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  // Xoay ảnh nhanh 90 độ
  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90) % 360);
  };

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Đặt lại các thông số về mặc định
  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  // Áp dụng cắt ảnh
  const handleApply = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setProcessing(true);
      const croppedFile = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        fileName
      );

      if (typeof onApplyCrop === 'function') {
        await onApplyCrop(croppedFile, {
          crop,
          zoom,
          rotation,
          croppedAreaPixels,
        });
      }
    } catch (err) {
      console.error('[AvatarCropModal Error]:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal
      open={open}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text strong style={{ fontSize: 16 }}>
            Chỉnh Sửa & Cắt Ảnh Đại Diện
          </Text>
        </div>
      }
      onCancel={onCancel}
      width={560}
      destroyOnClose
      centered
      footer={[
        <Button key="reset" icon={<UndoOutlined />} onClick={handleReset} disabled={processing}>
          Đặt Lại
        </Button>,
        <Button key="cancel" icon={<CloseOutlined />} onClick={onCancel} disabled={processing}>
          Hủy
        </Button>,
        <Button
          key="apply"
          type="primary"
          icon={<CheckOutlined />}
          loading={processing}
          onClick={handleApply}
          style={{ backgroundColor: '#1890ff', fontWeight: 600 }}
        >
          Áp Dụng & Lưu Ảnh
        </Button>,
      ]}
    >
      <div style={{ padding: '8px 0' }}>
        <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
          💡 Kéo ảnh để căn chỉnh vị trí vào đúng khung tròn. Sử dụng thanh trượt bên dưới để phóng to, thu nhỏ hoặc xoay.
        </Text>

        {/* Khung Cropper tương tác (react-easy-crop) */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 340,
            background: '#1a1a1a',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
          }}
        >
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropCompleteHandler}
            />
          )}
        </div>

        {/* Bảng điều khiển Zoom & Xoay */}
        <div
          style={{
            marginTop: 18,
            padding: '12px 16px',
            background: '#f8fafc',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
          }}
        >
          {/* Thanh trượt Thu phóng */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <ZoomOutOutlined style={{ color: '#64748b', fontSize: 16 }} />
            <Text style={{ fontSize: 13, minWidth: 70, color: '#475569' }}>Thu phóng:</Text>
            <Slider
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={setZoom}
              style={{ flex: 1, margin: '0 8px' }}
              tooltip={{ formatter: (val) => `${val.toFixed(1)}x` }}
            />
            <ZoomInOutlined style={{ color: '#64748b', fontSize: 16 }} />
          </div>

          {/* Các nút xoay góc */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 }}>
            <Text style={{ fontSize: 13, color: '#475569' }}>Xoay góc ({rotation}°):</Text>
            <Space>
              <Tooltip title="Xoay trái 90°">
                <Button size="small" icon={<RotateLeftOutlined />} onClick={handleRotateLeft}>
                  -90°
                </Button>
              </Tooltip>
              <Tooltip title="Xoay phải 90°">
                <Button size="small" icon={<RotateRightOutlined />} onClick={handleRotateRight}>
                  +90°
                </Button>
              </Tooltip>
            </Space>
          </div>
        </div>
      </div>
    </Modal>
  );
};

