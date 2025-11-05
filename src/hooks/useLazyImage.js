/**
 * useLazyImage Hook - React hook สำหรับ lazy loading รูปภาพ
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import ImageCacheService from '../services/imageCacheService';

export const useLazyImage = (src, options = {}) => {
  const {
    size = 'medium',
    progressive = false,
    imageSizes = null,
    preload = false,
    priority = 'normal'
  } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(null);
  const imgRef = useRef(null);

  // Setup lazy loading
  const setupLazyLoading = useCallback(() => {
    if (!imgRef.current || !src) return;

    const imgElement = imgRef.current;
    
    if (progressive && imageSizes) {
      ImageCacheService.setupProgressiveLoading(imgElement, imageSizes);
    } else {
      ImageCacheService.setupLazyLoading(imgElement, src, size);
    }

    // Listen for load events
    const handleLoad = () => {
      setIsLoading(false);
      setIsLoaded(true);
      setHasError(false);
      setCurrentSrc(imgElement.src);
    };

    const handleError = () => {
      setIsLoading(false);
      setIsLoaded(false);
      setHasError(true);
    };

    imgElement.addEventListener('load', handleLoad);
    imgElement.addEventListener('error', handleError);

    return () => {
      imgElement.removeEventListener('load', handleLoad);
      imgElement.removeEventListener('error', handleError);
    };
  }, [src, size, progressive, imageSizes]);

  // Preload image if requested
  useEffect(() => {
    if (preload && src) {
      ImageCacheService.preloadImages([src], size, priority);
    }
  }, [src, size, preload, priority]);

  // Setup lazy loading when component mounts
  useEffect(() => {
    const cleanup = setupLazyLoading();
    return cleanup;
  }, [setupLazyLoading]);

  // Reset states when src changes
  useEffect(() => {
    setIsLoading(true);
    setIsLoaded(false);
    setHasError(false);
    setCurrentSrc(null);
  }, [src]);

  return {
    imgRef,
    isLoading,
    isLoaded,
    hasError,
    currentSrc
  };
};

export const useLazyImageList = (imageSrcs, options = {}) => {
  const {
    size = 'medium',
    preloadCount = 3,
    priority = 'normal'
  } = options;

  const [loadedImages, setLoadedImages] = useState(new Set());
  const [loadingImages, setLoadingImages] = useState(new Set());
  const [errorImages, setErrorImages] = useState(new Set());

  // Preload first few images
  useEffect(() => {
    if (imageSrcs.length > 0) {
      const preloadSrcs = imageSrcs.slice(0, preloadCount);
      ImageCacheService.preloadImages(preloadSrcs, size, priority);
    }
  }, [imageSrcs, preloadCount, size, priority]);

  const createImageRef = useCallback((src) => {
    const { imgRef, isLoading, isLoaded, hasError } = useLazyImage(src, { size });

    // Update state when image status changes
    useEffect(() => {
      if (isLoading) {
        setLoadingImages(prev => new Set([...prev, src]));
        setLoadedImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });
        setErrorImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });
      } else if (isLoaded) {
        setLoadedImages(prev => new Set([...prev, src]));
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });
      } else if (hasError) {
        setErrorImages(prev => new Set([...prev, src]));
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });
      }
    }, [isLoading, isLoaded, hasError, src]);

    return { imgRef, isLoading, isLoaded, hasError };
  }, [size]);

  return {
    createImageRef,
    loadedImages,
    loadingImages,
    errorImages,
    stats: {
      total: imageSrcs.length,
      loaded: loadedImages.size,
      loading: loadingImages.size,
      errors: errorImages.size
    }
  };
};

export default useLazyImage;