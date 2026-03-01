interface StepIndicatorProps {
  steps: string[];
  currentStep: number; // 1-indexed
}

function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center w-full">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        const circleClasses = isCurrent
          ? 'bg-primary-500 text-white'
          : isCompleted
            ? 'bg-primary-500/20 text-primary-400'
            : 'bg-dark-card text-light-muted border border-dark-border';

        const labelClasses = isCurrent ? 'text-light-text' : 'text-light-muted';

        return (
          <div key={index} className="flex items-center flex-1 last:flex-none">
            {/* Step circle + label */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold shrink-0 ${circleClasses}`}
              >
                {stepNumber}
              </div>
              <span
                className={`hidden sm:block mt-2 text-xs text-center whitespace-nowrap ${labelClasses}`}
              >
                {label}
              </span>
            </div>

            {/* Connecting line */}
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 ${
                  stepNumber < currentStep ? 'bg-primary-500' : 'bg-dark-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default StepIndicator;
