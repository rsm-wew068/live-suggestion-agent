import { renderHook, act } from "@testing-library/react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

// Mock MediaRecorder
class MockMediaRecorder {
  static isTypeSupported = jest.fn().mockReturnValue(true);
  state: "inactive" | "recording" = "inactive";
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((e: Event) => void) | null = null;
  mimeType: string;

  constructor(_stream: MediaStream, options: { mimeType?: string } = {}) {
    this.mimeType = options.mimeType || "audio/webm";
  }

  start() {
    this.state = "recording";
  }

  stop() {
    this.state = "inactive";
    if (this.ondataavailable) {
      this.ondataavailable({ data: new Blob(["audio-chunk"], { type: this.mimeType }) });
    }
    if (this.onstop) {
      this.onstop();
    }
  }

  requestData() {
    if (this.ondataavailable) {
      this.ondataavailable({ data: new Blob(["requested-chunk"], { type: this.mimeType }) });
    }
  }
}

// Mock navigator.mediaDevices
Object.defineProperty(global.navigator, "mediaDevices", {
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }],
    }),
  },
  writable: true,
});

// Assign mock before tests
(global as any).MediaRecorder = MockMediaRecorder;

describe("useAudioRecorder", () => {
  const onChunk = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("starts recording and sets state to true", async () => {
    const { result } = renderHook(() => useAudioRecorder(onChunk));

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.recording).toBe(true);
  });

  it("stops recording and sets state to false", async () => {
    const { result } = renderHook(() => useAudioRecorder(onChunk));

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.recording).toBe(true);

    act(() => {
      result.current.stopRecording();
    });

    expect(result.current.recording).toBe(false);
  });

  it("calls onChunk when interval fires and recorder is stopped", async () => {
    const { result } = renderHook(() =>
      useAudioRecorder(onChunk, 10000)
    );

    await act(async () => {
      await result.current.startRecording();
    });

    // Advance past the interval
    await act(async () => {
      jest.advanceTimersByTime(10000);
    });

    expect(onChunk).toHaveBeenCalled();

    const blob = onChunk.mock.calls[0][0] as Blob;
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });

  it("does not call onChunk after stop", async () => {
    const { result } = renderHook(() =>
      useAudioRecorder(onChunk, 10000)
    );

    await act(async () => {
      await result.current.startRecording();
    });

    act(() => {
      result.current.stopRecording();
    });

    onChunk.mockClear();

    await act(async () => {
      jest.advanceTimersByTime(10000);
    });

    expect(onChunk).not.toHaveBeenCalled();
  });
});
