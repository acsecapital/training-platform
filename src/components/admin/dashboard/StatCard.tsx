import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: number;
    isPositive: boolean;
};
  bgColor?: string;
  textColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  change,
  bgColor = 'bg-white',
  textColor = 'text-neutral-900',
}) => {
  return (
    <div className={`${bgColor} rounded-xl shadow-sm p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">{title}</p>
          <p className={`mt-2 text-3xl font-semibold ${textColor}`}>{value}</p>
          
          {change && (
            <div className="mt-2 flex items-center">
              <span
                className={`text-sm font-medium ${
                  change.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
              >
                {change.isPositive ? '+' : ''}
                {change.value}%
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 ml-1 ${
                  change.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {change.isPositive ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                )}
              </svg>
              <span className="text-xs text-neutral-500 ml-1">vs last month</span>
            </div>
          )}
        </div>
        
        <div className="p-3 rounded-full bg-primary-50 text-primary">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
