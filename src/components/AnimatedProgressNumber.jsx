import React, { useState, useEffect } from 'react';

const AnimatedProgressNumber = ({
  targetValue,
  isAnimating,
  onAnimationComplete,
}) => {
  const [currentValue, setCurrentValue] = useState(parseFloat((targetValue || 0).toFixed(1)));

  useEffect(() => {
    if (isAnimating) {
      let animationFrameId;
      const startValue = currentValue;
      const duration = 1000; // Duración de 1 segundo
      let startTime = null;

      const animate = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const progress = (currentTime - startTime) / duration;

        if (progress < 1) {
          // Usar una función de easing exponencial (ease-in-out)
          const easedProgress = progress < 0.5 
            ? Math.pow(2, 20 * progress - 10) / 2 
            : (2 - Math.pow(2, -20 * progress + 10)) / 2;

          const newValue =
            startValue + ((targetValue || 0) - startValue) * easedProgress;
          setCurrentValue(parseFloat(newValue.toFixed(1)));
          animationFrameId = requestAnimationFrame(animate);
        } else {
          setCurrentValue(parseFloat((targetValue || 0).toFixed(1)));
          if (onAnimationComplete) {
            onAnimationComplete();
          }
        }
      };

      animationFrameId = requestAnimationFrame(animate);

      return () => {
        cancelAnimationFrame(animationFrameId);
      };
    } else {
      setCurrentValue(parseFloat((targetValue || 0).toFixed(1)));
    }
  }, [targetValue, isAnimating, onAnimationComplete]);

  return (
    <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '5px', overflow: 'hidden', marginTop: '10px' }}>
      <div
        style={{
          width: `${currentValue}%`,
          backgroundColor: '#4CAF50',
          height: '20px',
          borderRadius: '5px',
          textAlign: 'center',
          color: 'white',
          lineHeight: '20px',
          transition: 'width 0.5s ease-in-out',
        }}
      >
        {currentValue.toFixed(1)}%
      </div>
    </div>
  );
};

export default AnimatedProgressNumber;
