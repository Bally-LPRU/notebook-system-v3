import React, { useState, useEffect, useRef } from 'react';
import ImageService from '../../services/imageService';

/**
 * ThumbnailGrid Component - Display thumbnail grid for equipment cards with lazy loading
 */
const ThumbnailGrid = ({
  images = [],
  maxDisplay = 4,
  size = 'small', // 'small', 'medium', 'large'
  onClick = null,
  className = '',
  showCount = true,
  lazy = true
}) => {
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [isIntersecting, setIsIntersecting] = useState(!lazy);
  const containerRef = useRef(null);

  // Size configurations
  const sizeConfig = {
    small: {
      container: 'h-16',
      single: 'h-16 w-16',
      grid: 'h-8 w-8',
      text: 'text-xs'
    },
    medium: {
      container: 'h-24',
      single: 'h-24 w-24',
      grid: 'h-12 w-12',
      text: 'text-sm'
    },
    large: {
      container: 'h-32',
      single: 'h-32 w-32',
      grid: 'h-16 w-16',
      text: 'text-base'
    }
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [lazy]);

  // Preload images when they become visible
  useEffect(() => {
    if (!isIntersecting || images.length === 0) return;

    const imagesToLoad = images.slice(0, maxDisplay);
    
    imagesToLoad.forEach((image, index) => {
      const src = ImageService.getImageUrl(image, 'thumbnail');
      if (src && !loadedImages.has(src)) {
        const img = new Image();
        img.onload = () => {
          setLoadedImages(prev => new Set([...prev, src]));
        };
        img.src = src;
      }
    });
  }, [isIntersecting, images, maxDisplay, loadedImages]);

  // Handle click
  const handleClick = (index) => {
    if (onClick) {
      onClick(index, images[index]);
    }
  };

  // Empty state
  if (!images || images.length === 0) {
    return (
      <div 
        ref={containerRef}
        className={`${config.container} ${className} flex items-center justify-center bg-gray-100 rounded-lg`}
      >
        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  const displayImages = images.slice(0, maxDisplay);
  const remainingCount = Math.max(0, images.length - maxDisplay);

  // Single image display
  if (displayImages.length === 1) {
    const image = displayImages[0];
    const src = ImageService.getImageUrl(image, 'thumbnail');
    const isLoaded = loadedImages.has(src);

    return (
      <div 
        ref={containerRef}
        className={`${config.single} ${className} relative rounded-lg overflow-hidden bg-gray-100 ${
          onClick ? 'cursor-pointer hover:opacity-90 transition-opacity duration-200' : ''
        }`}
        onClick={() => handleClick(0)}
      >
        {isIntersecting && (
          <>
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse bg-gray-200 w-full h-full"></div>
              </div>
            )}
            <img
              src={src}
              alt="รูปภาพอุปกรณ์"
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading="lazy"
            />
          </>
        )}
        
        {showCount && images.length > 1 && (
          <div className={`absolute bottom-1 right-1 bg-black bg-opacity-60 text-white px-1 py-0.5 rounded ${config.text}`}>
            +{images.length - 1}
          </div>
        )}
      </div>
    );
  }

  // Multiple images grid
  const gridLayout = displayImages.length === 2 ? 'grid-cols-2' : 'grid-cols-2';
  
  return (
    <div 
      ref={containerRef}
      className={`${config.container} ${className} relative`}
    >
      <div className={`grid ${gridLayout} gap-1 h-full`}>
        {displayImages.map((image, index) => {
          const src = ImageService.getImageUrl(image, 'thumbnail');
          const isLoaded = loadedImages.has(src);
          const isLastVisible = index === displayImages.length - 1;
          const shouldShowOverlay = isLastVisible && remainingCount > 0;

          return (
            <div
              key={image.id || index}
              className={`${config.grid} relative rounded overflow-hidden bg-gray-100 ${
                onClick ? 'cursor-pointer hover:opacity-90 transition-opacity duration-200' : ''
              }`}
              onClick={() => handleClick(index)}
            >
              {isIntersecting && (
                <>
                  {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-pulse bg-gray-200 w-full h-full"></div>
                    </div>
                  )}
                  <img
                    src={src}
                    alt={`รูปภาพอุปกรณ์ ${index + 1}`}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      isLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    loading="lazy"
                  />
                </>
              )}

              {/* Overlay for remaining count */}
              {shouldShowOverlay && showCount && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                  <span className={`text-white font-medium ${config.text}`}>
                    +{remainingCount}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * LazyImage Component - Individual lazy-loaded image with loading state
 */
export const LazyImage = ({
  src,
  alt,
  className = '',
  placeholder = null,
  onLoad = null,
  onError = null
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const imgRef = useRef(null);

  // Intersection Observer
  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setHasError(true);
    if (onError) onError();
  };

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          {placeholder || (
            <div className="animate-pulse bg-gray-200 w-full h-full"></div>
          )}
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
      )}

      {/* Actual image */}
      {isIntersecting && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
    </div>
  );
};

export default ThumbnailGrid;