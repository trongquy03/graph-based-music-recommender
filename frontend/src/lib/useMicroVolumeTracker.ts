import { useEffect, useRef, useState } from "react";

export const useMicroVolumeTracker = (enabled: boolean) => {
  const [volumeTimeline, setVolumeTimeline] = useState<{ time: number; volume: number }[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const startTracking = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;

      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;

      intervalRef.current = window.setInterval(() => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setVolumeTimeline((prev) => [
          ...prev,
          { time: performance.now(), volume: avg }

        ]);
      }, 100);
    };

    startTracking();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [enabled]);

  return volumeTimeline;
};
