import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { exhibitionStore, useExhibitionStore } from '../../store/exhibitionStore';
import { soundscape } from '../../audio/SoundscapeEngine';

export const AudioController: React.FC = () => {
  const { audioEnabled, audioVolume } = useExhibitionStore();
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);

  // Audio waveform visualizer
  useEffect(() => {
    if (!audioEnabled) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      // Clear canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      return;
    }

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const data = soundscape.getVisualizerData();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = 3;
      const gap = 2;
      const barCount = 10;
      const startX = (canvas.width - (barCount * (barWidth + gap))) / 2;

      for (let i = 0; i < barCount; i++) {
        const val = data[i * 2] || 0;
        const barHeight = Math.max(2, (val / 255) * canvas.height * 0.9);
        const y = (canvas.height - barHeight) / 2;

        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(startX + i * (barWidth + gap), y, barWidth, barHeight);
      }
    };

    draw();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [audioEnabled]);

  return (
    <div
      className="relative flex items-center gap-2"
      onMouseEnter={() => setShowVolumeSlider(true)}
      onMouseLeave={() => setShowVolumeSlider(false)}
    >
      <button
        onClick={() => exhibitionStore.toggleAudio()}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border ${
          audioEnabled
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10'
            : 'bg-slate-900/60 text-slate-400 border-slate-700/60 hover:text-slate-200 hover:border-slate-500'
        }`}
        title={audioEnabled ? 'Mute Ambient Soundscape' : 'Enable Ambient Soundscape'}
      >
        {audioEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        <span className="hidden sm:inline">{audioEnabled ? 'Soundscape On' : 'Soundscape'}</span>
        
        {/* Real-time wave canvas */}
        <canvas
          ref={canvasRef}
          width={50}
          height={16}
          className={`w-12 h-4 ${audioEnabled ? 'opacity-100' : 'opacity-20'}`}
        />
      </button>

      {/* Pop-out volume slider */}
      {showVolumeSlider && audioEnabled && (
        <div className="absolute top-full left-0 mt-2 p-2 rounded-xl glass-panel flex items-center gap-2 z-50 animate-fadeIn">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={audioVolume}
            onChange={(e) => exhibitionStore.setAudioVolume(parseFloat(e.target.value))}
            className="w-20 accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg appearance-none"
          />
          <span className="text-[10px] font-mono text-slate-300">
            {Math.round(audioVolume * 100)}%
          </span>
        </div>
      )}
    </div>
  );
};
