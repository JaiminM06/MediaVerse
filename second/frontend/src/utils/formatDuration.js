/**
 * Formats a duration in seconds to MM:SS string.
 * Returns '—' for invalid/missing durations.
 */
export const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};
