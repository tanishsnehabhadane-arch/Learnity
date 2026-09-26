"use client";

import { useEffect, useState } from "react";
import { useUIStore } from "@/store/useUIStore";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const FONT_SCALES = ["90%", "100%", "125%", "200%"] as const;

export default function SettingsPage() {
  const { colorScheme, setColorScheme, reduceFeedbackIntensity, setReduceFeedbackIntensity } = useUIStore();
  const [fontScale, setFontScale] = useState<string>("100%");
  const [leaderboardOptIn, setLeaderboardOptIn] = useState(false);

  useEffect(() => {
    document.documentElement.style.fontSize = fontScale === "100%" ? "" : fontScale;
  }, [fontScale]);

  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-4 pb-24 pt-24">
      <h1 className="font-display text-5xl font-black uppercase">Settings</h1>

      <Card className="mt-8">
        <CardBody className="p-6">
          <fieldset>
            <legend className="font-tech text-sm font-bold uppercase">Color scheme</legend>
            <div className="mt-3 flex gap-2">
              {(["light", "dark", "system"] as const).map((scheme) => (
                <Button
                  key={scheme}
                  size="sm"
                  variant={colorScheme === scheme ? "primary" : "outline"}
                  onClick={() => setColorScheme(scheme)}
                  aria-pressed={colorScheme === scheme}
                >
                  {scheme}
                </Button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="font-tech text-sm font-bold uppercase">Accessibility</legend>
            <label className="mt-3 flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={reduceFeedbackIntensity}
                onChange={(e) => setReduceFeedbackIntensity(e.target.checked)}
                className="h-5 w-5 border-2 border-black dark:border-white"
              />
              Reduce feedback intensity (no shake/confetti)
            </label>
            <div className="mt-4">
              <p className="font-tech text-xs uppercase">Font size (scales to 200% without breaking layout)</p>
              <div className="mt-2 flex gap-2">
                {FONT_SCALES.map((scale) => (
                  <Button
                    key={scale}
                    size="sm"
                    variant={fontScale === scale ? "secondary" : "outline"}
                    onClick={() => setFontScale(scale)}
                    aria-pressed={fontScale === scale}
                  >
                    {scale}
                  </Button>
                ))}
              </div>
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="font-tech text-sm font-bold uppercase">Privacy</legend>
            <label className="mt-3 flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={leaderboardOptIn}
                onChange={(e) => setLeaderboardOptIn(e.target.checked)}
                className="h-5 w-5 border-2 border-black dark:border-white"
              />
              Appear on the leaderboard (opt-in)
            </label>
          </fieldset>
        </CardBody>
      </Card>
    </main>
  );
}
