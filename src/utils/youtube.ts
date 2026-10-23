/**
 * Utility to parse and extract YouTube Video ID from any valid YouTube URL format
 */
export function extractYouTubeVideoId(url: string | undefined | null): string | null {
  if (!url || typeof url !== 'string' || !url.trim()) return null;
  const str = url.trim();

  // Handle various formats:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID
  // - https://youtube.com/shorts/VIDEO_ID
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = str.match(regExp);

  if (match && match[1]) {
    return match[1];
  }

  // If the user pasted directly an 11-char video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }

  return null;
}
