import React, { useEffect, useRef } from 'react';
import { GalleryScene } from './GalleryScene';
import { useExhibitionStore } from '../../store/exhibitionStore';

interface GalleryCanvasProps {
  onSceneReady?: (scene: GalleryScene) => void;
}

export const GalleryCanvas: React.FC<GalleryCanvasProps> = ({ onSceneReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<GalleryScene | null>(null);

  const { artworks, theme, wings } = useExhibitionStore();

  // Mount 3D Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const galleryScene = new GalleryScene(containerRef.current);
    sceneRef.current = galleryScene;
    if (onSceneReady) {
      onSceneReady(galleryScene);
    }

    return () => {
      galleryScene.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Sync artworks if curator adds or removes pieces
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.syncArtworks(artworks);
    }
  }, [artworks]);

  // Sync section wings for corridor architectural partitions and welcome boards
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.corridor.updateWings(wings);
    }
  }, [wings]);

  // Sync architectural theme
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.applyTheme(theme);
    }
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden outline-none"
      tabIndex={0}
    />
  );
};
