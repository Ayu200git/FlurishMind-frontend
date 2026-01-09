import React from 'react';
import './Paginator.css';

const Paginator = ({ children, currentPage, lastPage, onPrevious, onNext, onPageChange, totalItems, perPage, onPerPageChange }) => {
  const pages = [];
  if (lastPage <= 7) {
    for (let i = 1; i <= lastPage; i++) pages.push(i);
  } else {
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', lastPage);
    } else if (currentPage >= lastPage - 3) {
      pages.push(1, '...', lastPage - 4, lastPage - 3, lastPage - 2, lastPage - 1, lastPage);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', lastPage);
    }
  }

  const startEntry = (currentPage - 1) * perPage + 1;
  const endEntry = Math.min(currentPage * perPage, totalItems);

  return (
    <div className="paginator-container">
      {/* Content */}
      <div className="paginator__content">
        {children}
      </div>

      {/* Bottom Controls: Summary + Pagination Buttons */}
      <div className="paginator__bottom-bar">
        <div className="paginator__summary">
          Showing {startEntry} to {endEntry} of {totalItems} Posts
        </div>

        <div className="paginator__controls">
          <label className="paginator__show-label">
            Show
            <select
              value={perPage}
              onChange={(e) => onPerPageChange(Number(e.target.value))}
              className="paginator__select"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
              <option value="25">25</option>
              <option value="30">30</option>
            </select>
            Posts
          </label>

          <button
            className="paginator__control"
            onClick={onPrevious}
            disabled={currentPage <= 1}
          >
            Previous
          </button>

          {pages.map((p, index) => (
            <button
              key={index}
              className={`paginator__number ${p === currentPage ? 'active' : ''}`}
              onClick={() => typeof p === 'number' && onPageChange && onPageChange(p)}
              disabled={typeof p !== 'number'}
            >
              {p}
            </button>
          ))}

          <button
            className="paginator__control"
            onClick={onNext}
            disabled={currentPage >= lastPage}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Paginator;
