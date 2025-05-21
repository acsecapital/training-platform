import React, {ReactNode } from 'react';

interface EnrollmentStatsCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  description?: string;
}

const EnrollmentStatsCard: React.FC<EnrollmentStatsCardProps> = ({
  title,
  value,
  icon,
  description
}) => {
  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-neutral-200">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-primary-50 rounded-md p-3">
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-neutral-500 truncate">
                {title}
              </dt>
              <dd>
                <div className="text-lg font-medium text-neutral-900">
                  {value}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {description && (
        <div className="bg-neutral-50 px-5 py-3">
          <div className="text-sm text-neutral-500">
            {description}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentStatsCard;
