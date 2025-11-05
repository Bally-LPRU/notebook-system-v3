import { useState, useEffect, useRef, useCallback } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';

const InfiniteScroll = ({
  children,
  hasMore = false,
  loading = false,
  onLoadMore,
  threshold = 1000,
  loader = null,
  endMessage = null,
  className = ""
}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const loadingRef = useRef(null);
  const observerRef = useRef(null);

  // Intersection Observer callback
  const handleIntersection = useCallback((entries) => {
    const [entry] = entries;
    setIsIntersecting(entry.isIntersecting);
  }, []);

  // Set up Intersection Observer
  useEffect(() => {
    const element = loadingRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin: `${threshold}px`,
      threshold: 0.1
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current && element) {
        observerRef.current.unobserve(element);
      }
    };
  }, [handleIntersection, threshold]);

  // Load more when intersecting
  useEffect(() => {
    if (isIntersecting && hasMore && !loading && onLoadMore) {
      onLoadMore();
    }
  }, [isIntersecting, hasMore, loading, onLoadMore]);

  // Fallback scroll listener for browsers that don't support Intersection Observer
  useEffect(() => {
    if ('IntersectionObserver' in window) return;

    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - threshold
      ) {
        if (hasMore && !loading && onLoadMore) {
          onLoadMore();
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, onLoadMore, threshold]);

  const defaultLoader = (
    <div className="text-center py-8">
      <LoadingSpinner size="md" />
      <p className="mt-2 text-sm text-gray-500">กำลังโหลดเพิ่มเติม...</p>
    </div>
  );

  const defaultEndMessage = (
    <div className="text-center py-8 text-gray-500">
      <p className="text-sm">แสดงครบทุกรายการแล้ว</p>
    </div>
  );

  return (
    <div className={className}>
      {children}
      
      {/* Loading indicator */}
      {hasMore && (
        <div ref={loadingRef}>
          {loading && (loader || defaultLoader)}
        </div>
      )}
      
      {/* End message */}
      {!hasMore && !loading && (endMessage || defaultEndMessage)}
    </div>
  );
};

export default InfiniteScroll;