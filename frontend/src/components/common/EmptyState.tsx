import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionLink?: React.ReactNode;
}

export function EmptyState({
  icon = '📦',
  title,
  description,
  actionText,
  onAction,
  actionLink,
}: EmptyStateProps) {
  return (
    <div className="state-box" role="status">
      <div className="state-box__icon" aria-hidden="true">
        {icon}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {onAction && actionText && (
        <button type="button" onClick={onAction} className="btn btn--primary">
          {actionText}
        </button>
      )}
      {actionLink}
    </div>
  );
}
