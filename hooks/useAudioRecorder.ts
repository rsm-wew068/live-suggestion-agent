"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseAudioRecorderReturn {
  recording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

export function useAudioRecorder(
  onChunk: (blob: Blob) => void,
  intervalMs: number = 10000
): UseAudioRecorderReturn {
  const [recording, setRecording] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const onChunkRef = useRef(onChunk);
  const stoppedRef = useRef(false);

  useEffect(() => {
    onChunkRef.current = onChunk;
  }, [onChunk]);

  const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : "audio/mp4";

  const captureChunk = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;

    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      if (chunks.length > 0 && !stoppedRef.current) {
        const blob = new Blob(chunks, { type: mimeType });
        onChunkRef.current(blob);
      }
      // Immediately start a new recorder if still recording
      if (!stoppedRef.current && streamRef.current) {
        startNewRecorder();
      }
    };

    recorder.stop();
  }, [mimeType]);

  const startNewRecorder = useCallback(() => {
    if (!streamRef.current || stoppedRef.current) return;

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorderRef.current = recorder;
    recorder.start();
  }, [mimeType]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      stoppedRef.current = false;

      startNewRecorder();
      setRecording(true);

      // Every intervalMs, stop the current recorder (triggers captureChunk via onstop)
      timerRef.current = setInterval(captureChunk, intervalMs);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  }, [intervalMs, startNewRecorder, captureChunk]);

  const stopRecording = useCallback(() => {
    stoppedRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setRecording(false);
  }, []);

  return { recording, startRecording, stopRecording };
}
