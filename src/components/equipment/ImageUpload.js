import React, { useState, useCallback, useRef } from 'react';
import ImageService from '../../services/imageService';
import MobileCameraService from '../../services/mobileCameraService';

/**
 * ImageUpload Component - Handle image upload with drag & drop and camera capture
 */
const ImageUpload = ({
  images = [],
  onImagesChange,
  maxImages = ImageService.MAX_IMAGES_PER_EQUIPMENT,
  disabled = false,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraInterface, setCameraInterface] = useState(null);
  const [previewImages, setPreviewImages] = useState([]);
  const fileInputRef = useRef(null);

  // Check if we can add more images
  const canAddMore = images.length < maxImages;
  const remainingSlots = maxImages - images.length;

  // Handle file selection
  const handleFileSelect = useCallback(async (files) => {
    if (!files || files.length === 0 || !canAddMore) return;

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    
    setIsUploading(true);
    setUploadProgress({ stage: 'processing', progress: 0, currentFile: 1, totalFiles: filesToProcess.length });

    try {
      // Create preview URLs immediately
      const previews = filesToProcess.map(file => ({
        file,
        preview: ImageService.createPreviewUrl(file),
        id: `preview_${Date.now()}_${Math.random()}`
      }));
      setPreviewImages(previews);

      // Process files
      const results = await ImageService.uploadImages(
        filesToProcess,
        'temp', // Will be replaced with actual equipment ID
        (progress) => setUploadProgress(progress)
      );

      // Filter successful uploads
      const successfulUploads = results.filter(result => !result.error);
      const errors = results.filter(result => result.error);

      if (successfulUploads.length > 0) {
        const newImages = [...images, ...successfulUploads];
        onImagesChange(newImages);
      }

      // Show errors if any
      if (errors.length > 0) {
        const errorMessages = errors.map(err => err.message).join('\n');
        alert(`เกิดข้อผิดพลาดในการอัปโหลด:\n${errorMessages}`);
      }

    } catch (error) {
      console.error('Upload error:', error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      // Cleanup preview URLs
      previewImages.forEach(preview => ImageService.revokePreviewUrl(preview.preview));
      setPreviewImages([]);
      setIsUploading(false);
      setUploadProgress(null);
    }
  }, [images, onImagesChange, canAddMore, remainingSlots, previewImages]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && canAddMore) {
      setIsDragging(true);
    }
  }, [disabled, canAddMore]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || !canAddMore) return;

    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [disabled, canAddMore, handleFileSelect]);

  // File input handler
  const handleFileInputChange = useCallback((e) => {
    handleFileSelect(e.target.files);
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFileSelect]);

  // Camera capture
  const handleCameraCapture = useCallback(async () => {
    if (!MobileCameraService.isCameraSupported()) {
      // Fallback to file input
      const files = await MobileCameraService.createFileInputFallback({ multiple: true });
      handleFileSelect(files);
      return;
    }

    try {
      const camera = await MobileCameraService.captureImage();
      setCameraInterface(camera);
      setShowCamera(true);
    } catch (error) {
      console.error('Camera error:', error);
      alert(`ไม่สามารถเปิดกล้องได้: ${error.message}`);
    }
  }, [handleFileSelect]);

  // Handle camera photo capture
  const handleCameraPhoto = useCallback(async () => {
    if (!cameraInterface) return;

    try {
      const blob = await cameraInterface.capturePhoto();
      const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
      await handleFileSelect([file]);
    } catch (error) {
      console.error('Camera capture error:', error);
      alert('ไม่สามารถถ่ายรูปได้');
    }
  }, [cameraInterface, handleFileSelect]);

  // Close camera
  const handleCloseCamera = useCallback(() => {
    if (cameraInterface) {
      cameraInterface.stop();
      setCameraInterface(null);
    }
    setShowCamera(false);
  }, [cameraInterface]);

  // Remove image
  const handleRemoveImage = useCallback((index) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  return (
    <div className={className}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : disabled
            ? 'border-gray-200 bg-gray-50'
            : canAddMore
            ? 'border-gray-300 hover:border-gray-400'
            : 'border-gray-200 bg-gray-50'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {isUploading ? (
          // Upload Progress
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            {uploadProgress && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {uploadProgress.stage === 'processing' && 'กำลังประมวลผลรูปภาพ...'}
                  {uploadProgress.stage === 'uploading' && 'กำลังอัปโหลด...'}
                  {uploadProgress.stage === 'complete' && 'เสร็จสิ้น!'}
                </p>
                {uploadProgress.fileName && (
                  <p className="text-xs text-gray-500">
                    {uploadProgress.currentFile}/{uploadProgress.totalFiles}: {uploadProgress.fileName}
                  </p>
                )}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Upload Interface
          <div className="space-y-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            
            {canAddMore ? (
              <>
                <div>
                  <p className="text-lg font-medium text-gray-900">อัปโหลดรูปภาพ</p>
                  <p className="text-sm text-gray-500">
                    ลากและวางไฟล์ หรือคลิกเพื่อเลือกไฟล์
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    รองรับ JPEG, PNG, WebP (สูงสุด {ImageService.MAX_FILE_SIZE / (1024 * 1024)}MB ต่อไฟล์)
                  </p>
                  <p className="text-xs text-gray-400">
                    เหลือที่ว่าง: {remainingSlots} รูป
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    เลือกไฟล์
                  </button>

                  {MobileCameraService.isCameraSupported() && (
                    <button
                      type="button"
                      onClick={handleCameraCapture}
                      disabled={disabled}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      ถ่ายรูป
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-500">ครบจำนวนรูปภาพแล้ว</p>
                <p className="text-sm text-gray-400">
                  สามารถอัปโหลดได้สูงสุด {maxImages} รูป
                </p>
              </div>
            )}
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || !canAddMore}
        />
      </div>

      {/* Preview Images */}
      {previewImages.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">กำลังประมวลผล...</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {previewImages.map((preview) => (
              <div key={preview.id} className="relative">
                <img
                  src={preview.preview}
                  alt="Preview"
                  className="w-full h-24 object-cover rounded-lg opacity-50"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Images */}
      {images.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">รูปภาพที่อัปโหลดแล้ว ({images.length})</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {images.map((image, index) => (
              <div key={image.id || index} className="relative group">
                <img
                  src={ImageService.getImageUrl(image, 'thumbnail')}
                  alt={`รูปที่ ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  aria-label="ลบรูปภาพ"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCamera && cameraInterface && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-4 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">ถ่ายรูป</h3>
              <button
                onClick={handleCloseCamera}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                {cameraInterface.video && (
                  <video
                    ref={(el) => {
                      if (el && cameraInterface.video !== el) {
                        el.srcObject = cameraInterface.stream;
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 object-cover"
                  />
                )}
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleCameraPhoto}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                >
                  ถ่ายรูป
                </button>
                <button
                  onClick={handleCloseCamera}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;