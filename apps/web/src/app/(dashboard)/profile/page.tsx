"use client";

import { useState } from "react";
import { useUserStore } from "@/store/useUserStore";
import { CertificateModal } from "@/components/features/CertificateModal";
import { Button } from "@/components/ui/Button";

export default function ProfilePage() {
  const { profile } = useUserStore();
  const [certificateOpen, setCertificateOpen] = useState(false);

  return (
    <main id="main" className="mx-auto w-full max-w-4xl px-4 pb-24 pt-24">
      <h1 className="font-display text-5xl font-black uppercase">{profile?.name ?? "Your profile"}</h1>
      <p className="mt-1 font-tech text-xs uppercase tracking-widest opacity-70">{profile?.email}</p>

      <section className="mt-8 border-2 border-black bg-white p-6 shadow-brutal dark:border-white dark:bg-neutral-900" aria-label="Achievements">
        <h2 className="font-tech text-sm font-bold uppercase">Badges</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {(profile?.badges ?? []).map((b) => (
            <li key={b.key} className="border-2 border-black px-2 py-1 font-tech text-[10px] font-bold uppercase dark:border-white">
              {b.name}
            </li>
          ))}
          {(profile?.badges ?? []).length === 0 && <li className="text-sm opacity-60">No badges yet.</li>}
        </ul>
      </section>

      <section className="mt-6 border-2 border-black bg-white p-6 shadow-brutal dark:border-white dark:bg-neutral-900" aria-label="Completed courses">
        <h2 className="font-tech text-sm font-bold uppercase">Completed courses</h2>
        <p className="mt-2 text-sm opacity-75">
          STUB: course-completion detection lands with mastery thresholds per course.
        </p>
        <Button className="mt-4" variant="secondary" onClick={() => setCertificateOpen(true)}>
          Preview certificate
        </Button>
      </section>

      <CertificateModal
        open={certificateOpen}
        onClose={() => setCertificateOpen(false)}
        studentName={profile?.name ?? "Learnity Student"}
        courseName="Algebra I"
      />
    </main>
  );
}
