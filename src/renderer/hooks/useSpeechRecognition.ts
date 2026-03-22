import { useState, useRef, useCallback } from 'react';

interface SpeechRecognitionState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
}

export function useSpeechRecognition() {
  const [state, setState] = useState<SpeechRecognitionState>({
    isListening: false,
    transcript: '',
    interimTranscript: '',
    error: null,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onCompleteRef = useRef<((text: string) => void) | null>(null);

  const start = useCallback((onComplete?: (text: string) => void) => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setState((s) => ({
        ...s,
        error: 'Speech recognition not supported in this browser',
      }));
      return;
    }

    onCompleteRef.current = onComplete || null;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';
    let silenceTimeout: ReturnType<typeof setTimeout> | null = null;

    recognition.onstart = () => {
      setState({
        isListening: true,
        transcript: '',
        interimTranscript: '',
        error: null,
      });
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }

      setState((s) => ({
        ...s,
        transcript: finalTranscript.trim(),
        interimTranscript: interim,
      }));

      // Reset silence timeout — if no speech for 2 seconds, stop
      if (silenceTimeout) clearTimeout(silenceTimeout);
      silenceTimeout = setTimeout(() => {
        recognition.stop();
      }, 2000);
    };

    recognition.onend = () => {
      if (silenceTimeout) clearTimeout(silenceTimeout);

      const text = finalTranscript.trim();
      setState((s) => ({
        ...s,
        isListening: false,
        transcript: text,
        interimTranscript: '',
      }));

      if (text && onCompleteRef.current) {
        onCompleteRef.current(text);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (silenceTimeout) clearTimeout(silenceTimeout);

      // 'no-speech' and 'aborted' are not real errors
      if (event.error === 'no-speech' || event.error === 'aborted') {
        setState((s) => ({ ...s, isListening: false }));
        return;
      }

      setState((s) => ({
        ...s,
        isListening: false,
        error: `Speech recognition error: ${event.error}`,
      }));
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  return {
    ...state,
    start,
    stop,
    fullTranscript: state.transcript + (state.interimTranscript ? ' ' + state.interimTranscript : ''),
  };
}
