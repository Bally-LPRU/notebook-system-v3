/**
 * ProgressiveImage - คอมโพเนนต์สำหรับโหลดรูปภาพแบบ progressive
 */

import React, { useState, useEffect, useRef } from 'react';
import useLazyImage from '../../hooks/useLazyImage';
import { SkeletonImage } from './SkeletonLoader';

const ProgressiveImage = ({
  src,
  thumbnailSrc,
  mediumSrc,
  alt = '',
  className = '',
  width,
  height,
  sizes,
  priority = false,
  onLoad,
  onError,
  placeholder = 'skeleton',
  blurDataURL,
  quality = 75,
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [loadedSizes, setLoadedSizes] = useState(new Set());
  const imgRef = useRef(null);

  // Determine image sizes to load
  const imageSizes = {
    thumbnail: thumbnailSrc,
    medium: mediumSrc || src,
    large: src
  };

  // Use lazy loading hook
  const {
    imgRef: lazyImgRef,
    isLoading,
    isLoaded: lazyIsLoaded,
    hasError: lazyHasError
  } = useLazyImage(src, {
    progressive: true,
    imageSizes,
    preload: priority,
    priority: priority ? 'high' : 'normal'
  });

  // Combine refs
  useEffect(() => {
    if (lazyImgRef.current && imgRef.current) {
      imgRef.current = lazyImgRef.current;
    }
  }, [lazyImgRef]);

  // Progressive loading logic
  useEffect(() => {
    if (!src) return;

    const loadImage = async (imageSrc, size) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ src: imageSrc, size });
        img.onerror = reject;
        img.src = imageSrc;
      });
    };

    const loadProgressively = async () => {
      try {
        // Load thumbnail first
        if (thumbnailSrc && !loadedSizes.has('thumbnail')) {
          const result = await loadImage(thumbnailSrc, 'thumbnail');
          setCurrentSrc(result.src);
          setLoadedSizes(prev => new Set([...prev, 'thumbnail']));
        }

        // Load medium size
        if (mediumSrc && !loadedSizes.has('medium')) {
          const result = await loadImage(mediumSrc, 'medium');
          setCurrentSrc(result.src);
          setLoadedSizes(prev => new Set([...prev, 'medium']));
        }

        // Load full size
        if (!loadedSizes.has('large')) {
          const result = await loadImage(src, 'large');
          setCurrentSrc(result.src);
          setLoadedSizes(prev => new Set([...prev, 'large']));
          setIsLoaded(true);
          onLoad?.(result);
        }
      } catch (error) {
        setHasError(true);
        onError?.(error);
      }
    };

    if (priority) {
      loadProgressively();
    }
  }, [src, thumbnailSrc, mediumSrc, priority, loadedSizes, onLoad, onError]);

  // Handle intersection observer for lazy loading
  useEffect(() => {
    if (!priority && imgRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const loadProgressively = async () => {
                try {
                  // Load thumbnail first
                  if (thumbnailSrc && !loadedSizes.has('thumbnail')) {
                    const img = new Image();
                    img.onload = () => {
                      setCurrentSrc(thumbnailSrc);
                      setLoadedSizes(prev => new Set([...prev, 'thumbnail']));
                    };
                    img.src = thumbnailSrc;
                  }

                  // Load medium size after a delay
                  setTimeout(async () => {
                    if (mediumSrc && !loadedSizes.has('medium')) {
                      const img = new Image();
                      img.onload = () => {
                        setCurrentSrc(mediumSrc);
                        setLoadedSizes(prev => new Set([...prev, 'medium']));
                      };
                      img.src = mediumSrc;
                    }
                  }, 500);

                  // Load full size after another delay
                  setTimeout(async () => {
                    if (!loadedSizes.has('large')) {
                      const img = new Image();
                      img.onload = () => {
                        setCurrentSrc(src);
                        setLoadedSizes(prev => new Set([...prev, 'large']));
                        setIsLoaded(true);
                        onLoad?.({ src, size: 'large' });
                      };
                      img.onerror = (error) => {
                        setHasError(true);
                        onError?.(error);
                      };
                      img.src = src;
                    }
                  }, 1000);
                } catch (error) {
                  setHasError(true);
                  onError?.(error);
                }
              };

              loadProgressively();
              observer.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '50px 0px',
          threshold: 0.01
        }
      );

      observer.observe(imgRef.current);

      return () => {
        if (imgRef.current) {
          observer.unobserve(imgRef.current);
        }
      };
    }
  }, [src, thumbnailSrc, mediumSrc, priority, loadedSizes, onLoad, onError]);

  // Render placeholder
  const renderPlaceholder = () => {
    if (placeholder === 'skeleton') {
      return <SkeletonImage width={width} height={height} className={className} />;
    }
    
    if (placeholder === 'blur' && blurDataURL) {
      return (
        <img
          src={blurDataURL}
          alt={alt}
          className={`${className} filter blur-sm`}
          style={{ width, height }}
        />
      );
    }

    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <svg 
          className="w-8 h-8 text-gray-400" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" 
            clipRule="evenodd" 
          />
        </svg>
      </div>
    );
  };

  // Render error state
  if (hasError || lazyHasError) {
    return (
      <div 
        className={`bg-red-50 border border-red-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-center text-red-500">
          <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
              clipRule="evenodd" 
            />
          </svg>
          <p className="text-xs">ไม่สามารถโหลดรูปภาพได้</p>
        </div>
      </div>
    );
  }

  // Show placeholder while loading
  if (!currentSrc && (isLoading || (!priority && !loadedSizes.has('thumbnail')))) {
    return renderPlaceholder();
  }

  // Determine image quality class
  const qualityClass = loadedSizes.has('large') 
    ? 'opacity-100' 
    : loadedSizes.has('medium') 
    ? 'opacity-90' 
    : 'opacity-75';

  return (
    <div className="relative overflow-hidden">
      {/* Blur placeholder for progressive loading */}
      {currentSrc && !isLoaded && blurDataURL && (
        <img
          src={blurDataURL}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover filter blur-sm ${className}`}
        />
      )}
      
      {/* Main image */}
      {currentSrc && (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          className={`transition-opacity duration-300 ${qualityClass} ${className}`}
          style={{ width, height }}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          {...props}
        />
      )}
      
      {/* Loading indicator */}
      {!isLoaded && currentSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default ProgressiveImage;