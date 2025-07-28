import React from "react";
import Button from "./Button";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "📝",
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">{icon}</div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">{title}</h2>
        <p className="text-gray-500 mb-6">{description}</p>
        {actionLabel && onAction && (
          <Button size="lg" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
