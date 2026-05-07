import React from 'react';
import '../styles/Dashboard.css';

interface HeroBannerProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  steps?: { label: string; isActive: boolean; isCompleted: boolean }[];
  onBack?: () => void;
}

export default function HeroBanner({
  title,
  subtitle,
  icon,
  steps,
  onBack
}: HeroBannerProps) {
  return (
    <div className="hero-banner">
      <div className="hero-banner-content">
        <div className={`hero-banner-header ${subtitle ? 'has-subtitle' : ''}`}>
          <div className="hero-banner-title-group">
            {icon && <div className="hero-banner-icon">{icon}</div>}
            <h2 className="hero-banner-title">{title}</h2>
          </div>
          {onBack && (
            <button onClick={onBack} className="hero-banner-back-btn">
              BACK
            </button>
          )}
        </div>
        {subtitle && <p className="hero-banner-subtitle">{subtitle}</p>}

        {steps && steps.length > 0 && (
          <div className="hero-steps">
            {steps.map((step, index) => (
              <div key={index} className="hero-step-item" style={{ opacity: step.isActive || step.isCompleted ? 1 : 0.5 }}>
                <div className={`hero-step-circle ${
                  step.label === 'Canceled' ? 'canceled' : 
                  step.isActive ? 'active' : 
                  step.isCompleted ? 'completed' : ''
                }`}>
                  {index + 1}
                </div>
                <span className={`hero-step-label ${step.isActive ? 'active' : ''}`}>{step.label}</span>
                {index < steps.length - 1 && <div className="hero-step-connector" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
