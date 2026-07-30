import React, { useEffect, useRef, useState } from 'react';
import YouTube, { YouTubeProps, YouTubePlayer as YTPlayer } from 'react-youtube';
import { Play, Pause, RotateCcw, Link2, Lock } from 'lucide-react';
import { VideoState } from '../types';

interface Props {
  videoState: VideoState;
  canControl: boolean;
  onPlay: (currentTime: number) => void;
  onPause: (currentTime: number) => void;
  onSeek: (time: number) => void;
  onChangeVideo: (urlOrId: string) => void;
}

export const YouTubePlayerComponent: React.FC<Props> = ({
  videoState,
  canControl,
  onPlay,
  onPause,
  onSeek,
  onChangeVideo,
}) => {
  const playerRef = useRef<YTPlayer | null>(null);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [isPlayingLocally, setIsPlayingLocally] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const isSyncingRef = useRef(false);

  // Helper function to synchronize player with video state
  const syncPlayerWithVideoState = (player: YTPlayer | null, state: VideoState) => {
    if (!player || !player.getPlayerState) return;

    isSyncingRef.current = true;

    // 1. Video ID sync
    const currentVideoUrl = player.getVideoUrl ? player.getVideoUrl() : '';
    if (state.videoId && !currentVideoUrl.includes(state.videoId)) {
      player.loadVideoById({
        videoId: state.videoId,
        startSeconds: state.currentTime,
      });
    } else {
      // 2. Timestamp seek sync (if drift > 1s)
      const curTime = player.getCurrentTime ? player.getCurrentTime() : 0;
      if (Math.abs(curTime - state.currentTime) > 1.0) {
        player.seekTo(state.currentTime, true);
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
      if (playerState !== 2) {
        player.pauseVideo();
        setIsPlayingLocally(false);
      }
    }

    setTimeout(() => {
      isSyncingRef.current = false;
    }, 600);
  };

  // Ready handler (triggers immediately when player mounts)
  const handleReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    setDuration(event.target.getDuration());
    // Sync video state immediately on mount / ready
    syncPlayerWithVideoState(event.target, videoState);
  };

  // Synchronize player with external socket videoState changes
  useEffect(() => {
    if (playerRef.current) {
      syncPlayerWithVideoState(playerRef.current, videoState);
    }
  }, [videoState]);

  // Periodic progress bar update
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        setCurrentTime(playerRef.current.getCurrentTime());
        setDuration(playerRef.current.getDuration());
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Handle local YouTube Player state change (if user clicks iframe directly)
  const handleStateChange: YouTubeProps['onStateChange'] = (event) => {
    if (isSyncingRef.current || !canControl) return;

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
    onChangeVideo(newVideoUrl.trim());
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
            onStateChange={handleStateChange}
            style={{ width: '100%', height: '100%' }}
          />
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
                    const time = playerRef.current?.getCurrentTime() || 0;
                    if (isPlayingLocally) {
                      onPause(time);
                    } else {
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
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
                <Lock size={16} /> View Only Mode (Host/Moderator controls video)
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
