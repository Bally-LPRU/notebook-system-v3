import React, { useState, useEffect, useCallback } from 'react';
import ImageService from '../../services/imageService';

/**
 * ImageGallery Component - Display equipment images with carousel and lightbox
 */
const ImageGallery = ({ 
  images = [], 
  editable = false, 
  onImagesChange = null,
  className = '',
  showThumbnails = true,
  autoPlay = false,
  autoPlayInterval = 3000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedImages, setLoadedImages] = useState(new Set());

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && images.length > 1 && !isLightboxOpen) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, autoPlayInterval);

      return () => clearInterval(interval);
    }
  }, [autoPlay, autoPlayInterval, images.length, isLightboxOpen]);

  // Preload images for better performance
  const preloadImage = useCallback((src) => {
    if (loadedImages.has(src)) return;

    const img = new Image();
    img.onload = () => {
      setLoadedImages(prev => new Set([...prev, src]));
    };
    img.src = src;
  }, [loadedImages]);

  // Preload current and next images
  useEffect(() => {
    if (images.length > 0) {
      const currentImage = images[currentIndex];
      if (currentImage) {
        preloadImage(ImageService.getImageUrl(currentImage, 'medium'));
        preloadImage(ImageService.getImageUrl(currentImage, 'original'));
      }

      // Preload next image
      const nextIndex = (currentIndex + 1) % images.length;
      const nextImage = images[nextIndex];
      if (nextImage) {
        preloadImage(ImageService.getImageUrl(nextImage, 'medium'));
      }
    }
  }, [currentIndex, images, preloadImage]);

  // Navigation functions
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goToIndex = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (!isLightboxOpen) return;

      switch (event.key) {
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case 'Escape':
          setIsLightboxOpen(false);
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isLightboxOpen, goToPrevious, goToNext]);

  // Handle image removal (if editable)
  const handleRemoveImage = useCallback(async (index) => {
    if (!editable || !onImagesChange) return;

    setIsLoading(true);
    try {
      const newImages = images.filter((_, i) => i !== index);
      await onImagesChange(newImages);
      
      // Adjust current index if necessary
      if (index <= currentIndex && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (index === currentIndex && currentIndex >= newImages.length) {
        setCurrentIndex(Math.max(0, newImages.length - 1));
      }
    } catch (error) {
      console.error('Error removing image:', error);
    } finally {
      setIsLoading(false);
    }
  }, [editable, onImagesChange, images, currentIndex]);

  // Empty state
  if (!images || images.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">ไม่มีรูปภาพ</p>
        </div>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <div className={`relative ${className}`}>
      {/* Main Image Display */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden">
        <div className="aspect-w-16 aspect-h-9">
          <img
            src={ImageService.getImageUrl(currentImage, 'medium')}
            alt={`รูปภาพที่ ${currentIndex + 1}`}
            className="w-full h-full object-cover cursor-pointer transition-opacity duration-300"
            onClick={() => setIsLightboxOpen(true)}
            loading="lazy"
          />
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all duration-200"
              aria-label="รูปก่อนหน้า"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all duration-200"
              aria-label="รูปถัดไป"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Remove Button (if editable) */}
        {editable && (
          <button
            onClick={() => handleRemoveImage(currentIndex)}
            className="absolute top-2 left-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors duration-200"
            aria-label="ลบรูปภาพ"
            disabled={isLoading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Fullscreen Button */}
        <button
          onClick={() => setIsLightboxOpen(true)}
          className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded hover:bg-opacity-75 transition-all duration-200"
          aria-label="ดูแบบเต็มจอ"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      {/* Thumbnail Navigation */}
      {showThumbnails && images.length > 1 && (
        <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.id || index}
              onClick={() => goToIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                index === currentIndex
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <img
                src={ImageService.getImageUrl(image, 'thumbnail')}
                alt={`ภาพย่อที่ ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <div className="relative max-w-full max-h-full">
            {/* Close Button */}
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all duration-200"
              aria-label="ปิด"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Lightbox Image */}
            <img
              src={ImageService.getImageUrl(currentImage, 'original')}
              alt={`รูปภาพที่ ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />

            {/* Lightbox Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all duration-200"
                  aria-label="รูปก่อนหน้า"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all duration-200"
                  aria-label="รูปถัดไป"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Lightbox Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;