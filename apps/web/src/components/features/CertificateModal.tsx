/**
 * CertificateModal — canvas-rendered completion certificate: brutalist border,
 * student name in collegiate display face, downloadable + Web Share API.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

export function CertificateModal({
  open,
  onClose,
  studentName,
  courseName,
}: {
  open: boolean;
  onClose: () => void;
  studentName: string;
  courseName: string;
}): JSX.Element | null {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 1200;
    const H = 850;
    canvas.width = W;
    canvas.height = H;

    // Background
    ctx.fillStyle = "#f8f7f6";
    ctx.fillRect(0, 0, W, H);

    // Brutalist double border
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 6;
    ctx.strokeRect(28, 28, W - 56, H - 56);
    ctx.lineWidth = 2;
    ctx.strokeRect(44, 44, W - 88, H - 88);

    // Accent bar
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(28, 28, 160, 12);

    // Header
    ctx.fillStyle = "#1a1a1a";
    ctx.font = "700 28px Orbitron, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("LEARNITY · CERTIFICATE OF COMPLETION", W / 2, 130);

    // Course
    ctx.font = "500 22px Poppins, system-ui, sans-serif";
    ctx.fillText("has successfully completed", W / 2, 250);

    ctx.font = "900 64px 'Collegiate FLF', Anton, system-ui, sans-serif";
    ctx.fillText(courseName.toUpperCase(), W / 2, 340);

    // Student name
    ctx.font = "600 44px Poppins, system-ui, sans-serif";
    ctx.fillStyle = "#ef4444";
    ctx.fillText(studentName, W / 2, 470);

    // Date + seal
    ctx.fillStyle = "#1a1a1a";
    ctx.font = "500 20px Poppins, system-ui, sans-serif";
    ctx.fillText(new Date().toLocaleDateString(undefined, { dateStyle: "long" }), W / 2, 620);
    ctx.font = "700 20px Orbitron, system-ui, sans-serif";
    ctx.strokeRect(W / 2 - 60, 680, 120, 60);
    ctx.fillText("VERIFIED", W / 2, 718);
  }, [courseName, studentName]);

  useEffect(() => {
    if (open) render();
  }, [open, render]);

  if (!open) return null;

  const download = (): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `learnity-certificate-${courseName.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const share = async (): Promise<void> => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      const file = blob ? new File([blob], "learnity-certificate.png", { type: "image/png" }) : null;
      if (file && "canShare" in navigator && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "My Learnity certificate" });
        setShareError(null);
      } else {
        download();
      }
    } catch {
      setShareError("Sharing isn't available here — the certificate was downloaded instead.");
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Completion certificate">
      <div className="max-h-[90dvh] w-full max-w-3xl overflow-auto border-2 border-black bg-white p-4 shadow-brutal dark:border-white dark:bg-neutral-900">
        <canvas ref={canvasRef} className="w-full border-2 border-black dark:border-white" aria-label="Certificate preview" />
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="secondary" onClick={() => void share()}>
            Share
          </Button>
          <Button onClick={download}>Download</Button>
        </div>
        {shareError && <p className="mt-2 text-right text-xs text-gap">{shareError}</p>}
      </div>
    </div>
  );
}
