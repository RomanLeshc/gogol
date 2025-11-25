'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7; // Maximum visible page numbers

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        // Near the beginning: show first 3 pages, then ellipsis, then last 3 pages
        const firstPages = [1, 2, 3];
        const lastPages = [totalPages - 2, totalPages - 1, totalPages];
        
        // Check if there's overlap
        const hasOverlap = lastPages[0] <= firstPages[firstPages.length - 1];
        
        if (hasOverlap) {
          // If overlap, just show all pages without ellipsis
          for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push(...firstPages);
          pages.push('...');
          pages.push(...lastPages);
        }
      } else if (currentPage >= totalPages - 2) {
        // Near the end: show first 3 pages, then ellipsis, then last 3 pages
        const firstPages = [1, 2, 3];
        const lastPages = [totalPages - 2, totalPages - 1, totalPages];
        
        // Check if there's overlap
        const hasOverlap = lastPages[0] <= firstPages[firstPages.length - 1];
        
        if (hasOverlap) {
          // If overlap, just show all pages without ellipsis
          for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push(...firstPages);
          pages.push('...');
          pages.push(...lastPages);
        }
      } else {
        // In the middle: show first page, ellipsis, current-1, current, current+1, ellipsis, last page
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    // Remove duplicates and clean up consecutive ellipsis
    const cleanedPages: (number | string)[] = [];
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if (typeof page === 'number') {
        // Only add if not already in the array
        if (!cleanedPages.includes(page)) {
          cleanedPages.push(page);
        }
      } else {
        // For ellipsis, only add if previous item is not also ellipsis
        if (cleanedPages[cleanedPages.length - 1] !== '...') {
          cleanedPages.push(page);
        }
      }
    }

    return cleanedPages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Prev button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
          currentPage === 1
            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span>Prev</span>
      </button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-2 text-gray-400 dark:text-gray-600"
              >
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = pageNum === currentPage;

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
          currentPage === totalPages
            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        <span>Next</span>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
}

