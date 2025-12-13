
import React from 'react';
import { WorkflowStep, Language } from '../types';
import { t } from '../locales';

interface StepIndicatorProps {
  currentStep: WorkflowStep;
  lang: Language;
  onStepClick?: (step: WorkflowStep) => void;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, lang, onStepClick }) => {
  const tr = (key: any) => t(lang, key);
  
  const steps = [
    { id: WorkflowStep.SETUP, label: tr('stepSetup') },
    { id: WorkflowStep.EDITOR, label: tr('stepEditor') },
    { id: WorkflowStep.EXPORT, label: tr('stepExport') },
  ];

  return (
    <div className="flex items-center justify-center py-4 w-full">
      <div className="flex items-center space-x-2">
        {steps.map((step, idx) => {
          const isActive = step.id === currentStep;
          const isCompleted = steps.findIndex(s => s.id === currentStep) > idx;

          return (
            <div key={step.id} className="flex items-center">
              <div 
                className={`
                  flex items-center px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer
                  ${isActive 
                    ? 'bg-purple-600 text-white shadow-lg scale-105' 
                    : isCompleted 
                      ? 'bg-purple-100 text-purple-600 border border-purple-200 hover:bg-purple-200' 
                      : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'}
                `}
                onClick={() => (isActive || isCompleted) && onStepClick && onStepClick(step.id)}
              >
                <span className="mr-2">{idx + 1}</span>
                {step.label}
              </div>
              {idx < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 ${isCompleted ? 'bg-purple-200' : 'bg-gray-200'}`}></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
