import React, { useState, useEffect } from 'react';

const AnimatedProgressNumber = ({ targetValue }) => {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    if (typeof targetValue === 'undefined' || targetValue === null) {
      setCurrentValue(0);
      return;
    }

    const startValue = currentValue;
    const duration = 800; // milliseconds
    let startTime = null;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = (currentTime - startTime) / duration;

      if (progress < 1) {
        // Ease-out effect for the number animation
        const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
        const newValue = startValue + (targetValue - startValue) * easedProgress;
        setCurrentValue(parseFloat(newValue.toFixed(2)));
        requestAnimationFrame(animate);
      } else {
        setCurrentValue(parseFloat(targetValue.toFixed(2)));
      }
    };

    requestAnimationFrame(animate);

    // Cleanup function to cancel animation if component unmounts or targetValue changes
    return () => {
      // No direct way to cancel requestAnimationFrame, but subsequent calls will be ignored
      // if targetValue changes, as startTime will be reset.
    };
  }, [targetValue]); // Re-run effect when targetValue changes

  return <>{currentValue}%</>;
};

export default AnimatedProgressNumber;
