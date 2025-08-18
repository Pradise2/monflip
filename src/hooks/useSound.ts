import { useState, useCallback } from 'react';

export const useSound = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);

  const playFlipSound = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      const audio = new Audio('/clickb.m4a');
      audio.volume = 0.8; // Set volume to 70%
      audio.play().catch(error => {
        console.warn('Failed to play click sound:', error);
      });
    } catch (error) {
      console.warn('Error playing click sound:', error);
    }
  }, [soundEnabled]);

  const playWinSound = useCallback(() => {
    if (!soundEnabled) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
    oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2); // G5
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }, [soundEnabled]);

  const playLoseSound = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      const audio = new Audio('/lose.mp3');
      audio.volume = 0.8; // Set volume to 50%
      audio.play().catch(error => {
        console.warn('Failed to play lose sound:', error);
      });
    } catch (error) {
      console.warn('Error playing lose sound:', error);
    }
  }, [soundEnabled]);
  
  const playStartSound = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      const audio = new Audio('/start.m4a');
      audio.volume = 0.8; // Set volume to 70%
      audio.play().catch(error => {
        console.warn('Failed to play start sound:', error);
      });
    } catch (error) {
      console.warn('Error playing start sound:', error);
    }
  }, [soundEnabled]);
  
  const playCashOutSound = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      const audio = new Audio('/cashout.mp3');
      audio.volume = 0.8; // Set volume to 70%
      audio.play().catch(error => {
        console.warn('Failed to play cashout sound:', error);
      });
    } catch (error) {
      console.warn('Error playing cashout sound:', error);
    }
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  return {
    soundEnabled,
    toggleSound,
    playFlipSound,
    playWinSound,
    playLoseSound,
    playStartSound,
    playCashOutSound
  };
};