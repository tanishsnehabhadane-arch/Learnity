"use client";

import { DiagnosticAssessment } from "@/components/features/DiagnosticAssessment";

export default function DiagnosticPage() {
  // STUB: subject selection screen lands with multi-subject support.
  // The seed ships Algebra I; its id is resolved from the catalog at runtime.
  return <DiagnosticAssessment subjectId="algebra-i" />;
}
