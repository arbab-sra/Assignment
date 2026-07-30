import React, { useEffect, useRef, useState } from 'react';
import YouTube, { YouTubeProps, YouTubePlayer as YTPlayer } from 'react-youtube';
import toast from 'react-hot-toast';
import { Play, Pause, RotateCcw, Link2, Lock, RefreshCw } from 'lucide-react';
import { VideoState } from '../types';

interface Props {
  videoState: VideoState;
  canControl: boolean;
  onPlay: (currentTime: number) => void;
  onPause: (currentTime: number) => void;
  onSeek: (time: number) => void;
  onChangeVideo: (urlOrId: string) => void;
  onRequestSync?: () => void;
  onForceSyncAll?: () => void;
  currentSocketId?: string;
}

export const YouTubePlayerComponent: React.FC<Props> = ({
  videoState,
  canControl,
  onPlay,
  onPause,
  onSeek,
  onChangeVideo,
  onRequestSync,
  onForceSyncAll,
  currentSocketId,
}) => {
  const playerRef = useRef<YTPlayer | null>(null);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [isPlayingLocally, setIsPlayingLocally] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const isSyncingRef = useRef(false);

  // Helper to extract 11-char YouTube ID on client
  const extractVideoId = (urlOrId: string): string | null => {
    if (!urlOrId) return null;
    const str = urlOrId.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
    const match = str.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    if (match && match[2] && match[2].length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(match[2])) {
      return match[2];
    }
    return null;
  };

  const stateReceivedAtRef = useRef<number>(Date.now());
  const lastStateRef = useRef<VideoState>(videoState);

  // Helper function to synchronize player with video state
  const syncPlayerWithVideoState = (player: YTPlayer | null, state: VideoState) => {
    if (!player || !player.getPlayerState) return;

    // Echo suppression for sender socket to avoid double-pause or back-seeking on acting Host
    if (state.senderSocketId && currentSocketId && state.senderSocketId === currentSocketId) {
      return;
    }

    isSyncingRef.current = true;

    const validId = extractVideoId(state.videoId) || 'dQw4w9WgXcQ';
    
    // Sub-200ms Network Transit Time Compensation
    const transitTime = state.serverTimestamp
      ? Math.max(0, (Date.now() - state.serverTimestamp) / 1000)
      : (Date.now() - stateReceivedAtRef.current) / 1000;
    
    const elapsed = state.isPlaying ? transitTime : 0;
    const expectedTime = state.currentTime + elapsed;

    // 1. Video ID sync
    const currentVideoUrl = player.getVideoUrl ? player.getVideoUrl() : '';
    if (validId && !currentVideoUrl.includes(validId)) {
      try {
        if (state.isPlaying) {
          player.loadVideoById({
            videoId: validId,
            startSeconds: expectedTime,
          });
          setIsPlayingLocally(true);
        } else {
          player.cueVideoById({
            videoId: validId,
            startSeconds: expectedTime,
          });
          if (player.pauseVideo) {
            player.pauseVideo();
          }
          setIsPlayingLocally(false);
        }
      } catch (e) {
        console.warn('Error loading video:', e);
      }
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 1500);
      return;
    } else {
      // 2. Timestamp seek sync with refined drift thresholds
      const curTime = player.getCurrentTime ? player.getCurrentTime() : 0;
      const drift = Math.abs(curTime - expectedTime);
      const threshold = state.isPlaying ? 0.8 : 1.5; // Relax threshold when paused to avoid jitter
      
      if (drift > threshold) {
        player.seekTo(expectedTime, true);
      }
    }

    // 3. Play / Pause state sync
    const playerState = player.getPlayerState ? player.getPlayerState() : -1;
    if (state.isPlaying) {
      if (playerState !== 1) {
        player.playVideo();
        setIsPlayingLocally(true);
      }
    } else {
      player.pauseVideo();
      setIsPlayingLocally(false);
    }

    setTimeout(() => {
      isSyncingRef.current = false;
    }, 600);
  };

  // Ready handler (triggers immediately when player mounts)
  const handleReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    setDuration(event.target.getDuration());
    syncPlayerWithVideoState(event.target, videoState);
  };

  // Handle player playback or embedding errors without crashing page
  const handleError: YouTubeProps['onError'] = (e) => {
    console.warn('YouTube Player error code:', e?.data);
    toast.error('Could not play video (private, deleted, or invalid link).');
  };

  // Synchronize player with external socket videoState changes
  useEffect(() => {
    stateReceivedAtRef.current = Date.now();
    lastStateRef.current = videoState;
    if (playerRef.current) {
      syncPlayerWithVideoState(playerRef.current, videoState);
    }
  }, [videoState]);

  // Periodic progress bar update and participant runtime drift auto-correction
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const cur = playerRef.current.getCurrentTime();
        setCurrentTime(cur);
        setDuration(playerRef.current.getDuration());

        // For participants: auto-correct playback drift during continuous runtime
        if (!canControl && lastStateRef.current && !isSyncingRef.current) {
          const state = lastStateRef.current;
          if (state.isPlaying) {
            const elapsed = (Date.now() - stateReceivedAtRef.current) / 1000;
            const expected = state.currentTime + elapsed;
            const drift = Math.abs(cur - expected);

            // If drift exceeds 0.8s, perform seamless micro-seek to align with Host
            if (drift > 0.8) {
              playerRef.current.seekTo(expected, true);
            }
          }
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [canControl]);

  // Handle local YouTube Player state change (if user clicks iframe directly)
  const handleStateChange: YouTubeProps['onStateChange'] = (event) => {
    if (isSyncingRef.current) return;

    if (!canControl) {
      // Force re-sync if a non-controller participant manages to alter state
      if (playerRef.current) {
        syncPlayerWithVideoState(playerRef.current, videoState);
      }
      return;
    }

    const state = event.data;
    const time = playerRef.current?.getCurrentTime() || 0;

    // 1 = PLAYING
    if (state === 1) {
      setIsPlayingLocally(true);
      onPlay(time);
    } 
    // 2 = PAUSED
    else if (state === 2) {
      setIsPlayingLocally(false);
      onPause(time);
    }
  };

  const handleSeekSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canControl) return;
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    playerRef.current?.seekTo(targetTime, true);
    onSeek(targetTime);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canControl || !newVideoUrl.trim()) return;

    const extracted = extractVideoId(newVideoUrl.trim());
    if (!extracted) {
      toast.error('Invalid YouTube URL or Video ID. Please enter a valid YouTube link.');
      return;
    }

    onChangeVideo(extracted);
    setNewVideoUrl('');
  };

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0, // Controlled explicitly by syncPlayerWithVideoState
      controls: canControl ? 1 : 0, // Disable player controls for participants
      modestbranding: 1,
      rel: 0,
    },
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Video Container */}
      <div
        className="glass-panel"
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '56.25%', // 16:9 ratio
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <YouTube
            videoId={videoState.videoId}
            opts={opts}
            onReady={handleReady}
            onError={handleError}
            onStateChange={handleStateChange}
            style={{ width: '100%', height: '100%' }}
          />

          {/* Transparent Overlay Shield for Participants to block all video clicks */}
          {!canControl && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 20,
                background: 'transparent',
                cursor: 'default',
              }}
              title="Playback control is restricted to Host & Moderator"
            />
          )}
        </div>
      </div>

      {/* Control Bar & URL input */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Top Control row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          {/* Playback buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {canControl ? (
              <>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    const player = playerRef.current;
                    const time = player?.getCurrentTime ? player.getCurrentTime() : currentTime;
                    const isCurrentlyPlaying = player?.getPlayerState ? player.getPlayerState() === 1 : isPlayingLocally;

                    if (isCurrentlyPlaying) {
                      if (player?.pauseVideo) player.pauseVideo();
                      setIsPlayingLocally(false);
                      onPause(time);
                    } else {
                      if (player?.playVideo) player.playVideo();
                      setIsPlayingLocally(true);
                      onPlay(time);
                    }
                  }}
                >
                  {isPlayingLocally ? <Pause size={18} /> : <Play size={18} />}
                  {isPlayingLocally ? 'Pause' : 'Play'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    playerRef.current?.seekTo(0, true);
                    onSeek(0);
                  }}
                  title="Replay from start"
                >
                  <RotateCcw size={16} /> Rewind
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    if (onForceSyncAll) onForceSyncAll();
                    toast.success("Broadcasted Sync All to participants!");
                  }}
                  title="Force sync all participants in room"
                  style={{ background: 'rgba(180, 225, 235, 0.15)', color: 'var(--color-cyan)', borderColor: 'rgba(180, 225, 235, 0.3)' }}
                >
                  <RefreshCw size={15} /> Sync All
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    if (onRequestSync) onRequestSync();
                    if (playerRef.current) syncPlayerWithVideoState(playerRef.current, videoState);
                  }}
                  title="Click to sync your video instantly with the Host"
                  style={{ padding: '8px 14px', fontSize: '13px' }}
                >
                  <RefreshCw size={15} /> Sync with Host
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <Lock size={15} /> Controlled by Host
                </div>
              </div>
            )}
          </div>

          {/* Time display */}
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Progress Seek Slider */}
        {canControl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeekSlider}
              style={{
                width: '100%',
                accentColor: 'var(--accent-red)',
                cursor: 'pointer',
              }}
            />
          </div>
        )}

        {/* Change Video Input (Host & Moderator) */}
        {canControl ? (
          <form onSubmit={handleUrlSubmit} style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Link2
                size={16}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                className="glass-input"
                style={{ width: '100%', paddingLeft: '36px' }}
                placeholder="Paste YouTube Video URL or Video ID (e.g. https://www.youtube.com/watch?v=...)"
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-secondary">
              Load Video
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
};
