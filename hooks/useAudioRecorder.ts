"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseAudioRecorderReturn {
  recording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

function getMimeType(): string {
  if (typeof window === "undefined") return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus"))
    return "audio/webm;codecs=opus";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  return "audio/mp4";
}

export function useAudioRecorder(
  onChunk: (blob: Blob) => void,
  intervalMs: number = 30000
): UseAudioRecorderReturn {
  const [recording, setRecording] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const onChunkRef = useRef(onChunk);
  const stoppedRef = useRef(false);
  const mimeTypeRef = useRef("audio/webm");

  useEffect(() => {
    onChunkRef.current = onChunk;
  }, [onChunk]);

  const captureChunk = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;

    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      if (chunks.length > 0 && !stoppedRef.current) {
        const blob = new Blob(chunks, { type: mimeTypeRef.current });
        onChunkRef.current(blob);
      }
      if (!stoppedRef.current && streamRef.current) {
        startNewRecorder();
      }
    };

    recorder.stop();
  }, []);

  const startNewRecorder = useCallback(() => {
    if (!streamRef.current || stoppedRef.current) return;

    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: mimeTypeRef.current,
    });
    recorderRef.current = recorder;
    recorder.start();
  }, []);

  const startRecording = useCallback(async () => {
    try {
      mimeTypeRef.current = getMimeType();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      stoppedRef.current = false;

      startNewRecorder();
      setRecording(true);

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
