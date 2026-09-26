/**
 * VoiceInputButton — Web Speech API dictation for hands-free tutor questions.
 * Gracefully hides when the API is unavailable (e.g. Firefox).
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
}

type RecognitionCtor = new () => SpeechRecognitionLike;

export function VoiceInputButton({ onTranscript }: { onTranscript: (text: string) => void }): JSX.Element | null {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    setSupported(true);

    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result) transcript += result[0]?.transcript ?? "";
      }
      onTranscript(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.stop();
    };
  }, [onTranscript]);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => {
        if (listening) {
          recognitionRef.current?.stop();
          setListening(false);
        } else {
          recognitionRef.current?.start();
          setListening(true);
        }
      }}
      aria-label={listening ? "Stop dictation" : "Start voice input"}
      aria-pressed={listening}
      className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black dark:border-white"
    >
      {listening ? <MicOff className="h-4 w-4 text-crimson" aria-hidden /> : <Mic className="h-4 w-4" aria-hidden />}
    </button>
  );
}
