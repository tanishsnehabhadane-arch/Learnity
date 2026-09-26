"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardBody } from "@/components/ui/Card";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  return (
    <Card>
      <CardBody className="p-8">
        <h1 className="font-display text-4xl font-black uppercase">Reset password</h1>
        {sent ? (
          <p className="mt-4 text-sm opacity-75">
            If an account exists for that email, a reset link is on its way.
          </p>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <Input label="Email" type="email" required />
            <Button type="submit" className="w-full">
              Send reset link
            </Button>
          </form>
        )}
        <p className="mt-4 font-tech text-xs uppercase opacity-70">
          STUB: transactional email service lands in the auth phase.
        </p>
      </CardBody>
    </Card>
  );
}
