import React, { useState, useEffect, useRef, useCallback } from 'react';

interface CoinFlipProps {
  isFlipping: boolean;
  result: 'heads' | 'tails' | null;
  nextResult: 'heads' | 'tails' | null;
  onFlipComplete: () => void;
}

export const CoinFlip: React.FC<CoinFlipProps> = ({ isFlipping, result, nextResult, onFlipComplete }) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [frameHeight, setFrameHeight] = useState(150);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const loopCountRef = useRef(0);
  
  const totalFrames = 21;
  
  // Handle window resize to update coin size
  useEffect(() => {
    const handleResize = () => {
      // Increased the base size by 50% (from 150 to 225) and viewport width percentage (from 0.1 to 0.15)
      setFrameHeight(Math.min(225, window.innerWidth * 0.15));
    };
    
    // Set initial size
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const frameDuration = 30; // ~60 FPS for smoother animation
  const targetLoops = 7; // Number of full loops before stopping

  // Calculate total frames needed based on result
  const getTotalFramesNeeded = useCallback((flipResult: 'heads' | 'tails') => {
    // For heads: 5 full loops (90 frames) + 1 frame to reach frame 0
    // For tails: 5 full loops (90 frames) + 10 frames to reach frame 9
    return (totalFrames * targetLoops) + (flipResult === 'heads' ? 1 : 11);
  }, []);

  // Handle animation frame updates
  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) startTimeRef.current = timestamp;
    if (!result) return; // Don't animate if no result is set
    
    const elapsed = timestamp - startTimeRef.current;
    const totalFramesPassed = Math.floor(elapsed / frameDuration);
    const totalFramesNeeded = getTotalFramesNeeded(result);
    
    // Calculate the current frame based on total frames passed
    let frame;
    
    if (totalFramesPassed >= totalFramesNeeded - 1) {
      // Animation complete - show final frame based on result
      frame = result === 'heads' ? 0 : 10;
      console.log('Animation complete. Setting final frame to:', frame, 'for result:', result);
      setCurrentFrame(frame);
      
      // Call the animation completion handler from useGame
      if (typeof (window as any).__handleAnimationComplete === 'function') {
        (window as any).__handleAnimationComplete();
        // Clean up the handler to prevent multiple calls
        delete (window as any).__handleAnimationComplete;
      }
      
      // Animation complete - notify parent
      onFlipComplete();
      return;
    } else {
      // During animation - cycle through frames 0-17
      frame = totalFramesPassed % totalFrames;
      setCurrentFrame(frame);
    }
    
    // Continue the animation
    animationRef.current = requestAnimationFrame(animate);
  }, [result, onFlipComplete, getTotalFramesNeeded]);

  // Reset animation when a new flip starts
  useEffect(() => {
    if (isFlipping && result) {
      // Reset animation state
      startTimeRef.current = 0;
      loopCountRef.current = 0;
      
      // Start the animation
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isFlipping, result, animate]);

  // Handle flip animation start/stop
  useEffect(() => {
    if (isFlipping) {
      // Reset state for new animation
      loopCountRef.current = 0;
      startTimeRef.current = performance.now();
      
      // Start the animation
      animationRef.current = requestAnimationFrame(animate);
    }
    
    // Cleanup function
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isFlipping, animate]);

  // Calculate background position for the sprite sheet and rotation
  const displayPosition = `0px -${currentFrame * frameHeight}px`;
  // Calculate Z-rotation that matches the sprite animation
  // For initial state (when not flipping and no result), use 0 rotation
  if (!isFlipping && !result) {
    return (
      <div className="flex flex-col items-center">
        <div className="flex justify-center items-center h-64">
          <div 
            className="coin-sprite"
            style={{
              width: `${frameHeight}px`,
              height: `${frameHeight}px`,
              backgroundImage: 'url(/télécharger.png)',
              backgroundSize: `${frameHeight}px auto`,
              backgroundPosition: '0px 0px',
              backgroundRepeat: 'no-repeat',
              imageRendering: 'crisp-edges',
              willChange: 'transform, background-position',
              transform: 'perspective(1000px) rotateZ(0deg) translateZ(0)',
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden',
              transition: 'transform 0.1s ease-out',
            }}
          />
        </div>
      </div>
    );
  }

  // For flipping or when we have a result
  // Calculate rotation based on current frame and target frame
  const targetFrame = result === 'heads' ? 0 : 10; // Updated to match your frame index for tails
  const frameRotation = (currentFrame % totalFrames) * (360 / totalFrames);
  // Adjust rotation to ensure it ends at 0° for both heads and tails
  const rotation = frameRotation - ((targetFrame * 360) / totalFrames);

  // Removed debug information

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-center items-center h-64">
        <div 
          className="coin-sprite"
          style={{
            width: `${frameHeight}px`,
            height: `${frameHeight}px`,
            backgroundImage: 'url(/télécharger.png)',
            backgroundSize: `${frameHeight}px auto`,
            backgroundPosition: `0px -${currentFrame * frameHeight}px`,
            backgroundRepeat: 'no-repeat',
            imageRendering: 'crisp-edges',
            willChange: 'transform, background-position',
            transform: `perspective(1000px) rotateZ(${rotation}deg) translateZ(0)`,
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
            transition: 'transform 0.1s ease-out',
          }}
        />
      </div>
    </div>
  );
};