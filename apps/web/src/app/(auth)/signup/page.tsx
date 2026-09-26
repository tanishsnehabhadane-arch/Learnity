"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { api, setTokens } from "@/lib/axios-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardBody } from "@/components/ui/Card";

const schema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters"),
  });
type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const res = await api.post<{ accessToken: string; refreshToken: string }>("/auth/signup", values);
      setTokens(res.data.accessToken, res.data.refreshToken);
      router.push("/diagnostic");
    } catch {
      setServerError("Could not create the account (email taken?)");
    }
  });

  return (
    <Card>
      <CardBody className="p-8">
        <h1 className="font-display text-4xl font-black uppercase">Join Learnity</h1>
        <p className="mt-1 font-tech text-xs uppercase tracking-widest opacity-70">
          Calibration takes ~5 minutes
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <Input label="Name" autoComplete="name" {...register("name")} />
          {formState.errors.name && <p role="alert" className="text-xs text-crimson">{formState.errors.name.message}</p>}
          <Input label="Email" type="email" autoComplete="email" {...register("email")} />
          {formState.errors.email && <p role="alert" className="text-xs text-crimson">{formState.errors.email.message}</p>}
          <Input label="Password" type="password" autoComplete="new-password" {...register("password")} />
          {formState.errors.password && <p role="alert" className="text-xs text-crimson">{formState.errors.password.message}</p>}
          <Button type="submit" className="w-full" loading={formState.isSubmitting}>
            Create account
          </Button>
          {serverError && <p role="alert" className="text-xs text-crimson">{serverError}</p>}
        </form>
        <p className="mt-4 font-tech text-xs uppercase">
          <Link href="/login" className="underline">Already have an account? Log in</Link>
        </p>
      </CardBody>
    </Card>
  );
}
