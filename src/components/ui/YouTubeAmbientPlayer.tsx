import React, { useEffect, useRef } from 'react';
import { useExhibitionStore } from '../../store/exhibitionStore';
import { extractYouTubeVideoId } from '../../utils/youtube';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const YouTubeAmbientPlayer: React.FC = () => {
  const { salonInfo, audioEnabled, audioVolume } = useExhibitionStore();
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoId = extractYouTubeVideoId(salonInfo.ambientYoutubeUrl);

  // If no YouTube URL provided, do nothing!
  if (!videoId) {
    return null;
  }

  useEffect(() => {
    let isMounted = true;

    const initPlayer = () => {
      if (!isMounted || !window.YT || !window.YT.Player || !containerRef.current) return;

      try {
        if (playerRef.current) {
          playerRef.current.destroy();
        }

        playerRef.current = new window.YT.Player(containerRef.current, {
          height: '100',
          width: '100',
          videoId: videoId,
          playerVars: {
            autoplay: audioEnabled ? 1 : 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            loop: 1,
            playlist: videoId, // Required for loop in embedded iframe
            modestbranding: 1,
            playsinline: 1,
          },
          events: {
            onReady: (event: any) => {
              if (audioEnabled) {
                event.target.unMute();
                event.target.setVolume(Math.round(audioVolume * 100));
                event.target.playVideo();
              } else {
                event.target.pauseVideo();
              }
            },
            onStateChange: (event: any) => {
              // If video ends, replay
              if (event.data === window.YT.PlayerState.ENDED && audioEnabled) {
                event.target.playVideo();
              }
            },
          },
        });
      } catch (err) {
        console.warn('YouTube Player initialization notice:', err);
      }
    };

    // Load YouTube Iframe API script if not present
    if (!window.YT) {
      const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        window.onYouTubeIframeAPIReady = () => {
          initPlayer();
        };
        document.body.appendChild(tag);
      } else {
        const check = setInterval(() => {
          if (window.YT && window.YT.Player) {
            clearInterval(check);
            initPlayer();
          }
        }, 100);
      }
    } else {
      initPlayer();
    }

    return () => {
      isMounted = false;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (_) {}
        playerRef.current = null;
      }
    };
  }, [videoId]);

  // Handle Play/Pause
  useEffect(() => {
    if (!playerRef.current || typeof playerRef.current.playVideo !== 'function') return;

    try {
      if (audioEnabled) {
        playerRef.current.unMute();
        playerRef.current.setVolume(Math.round(audioVolume * 100));
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    } catch (_) {}
  }, [audioEnabled]);

  // Handle Volume
  useEffect(() => {
    if (!playerRef.current || typeof playerRef.current.setVolume !== 'function') return;

    try {
      playerRef.current.setVolume(Math.round(audioVolume * 100));
    } catch (_) {}
  }, [audioVolume]);

  return (
    <div
      className="fixed -bottom-96 -right-96 w-1 h-1 opacity-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <div ref={containerRef} id="ambient-youtube-player-element" />
    </div>
  );
};
