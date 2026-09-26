"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, setTokens } from "@/lib/axios-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardBody } from "@/components/ui/Card";
import Link from "next/link";
import { useState } from "react";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const res = await api.post<{ accessToken: string; refreshToken: string }>("/auth/login", values);
      setTokens(res.data.accessToken, res.data.refreshToken);
      router.push("/dashboard");
    } catch {
      setServerError("Invalid email or password");
    }
  });

  return (
    <Card>
      <CardBody className="p-8">
        <h1 className="font-display text-4xl font-black uppercase">Welcome back</h1>
        <p className="mt-1 font-tech text-xs uppercase tracking-widest opacity-70">
          Log in to continue your streak
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <Input label="Email" type="email" autoComplete="email" {...register("email")} />
          {formState.errors.email && <p role="alert" className="text-xs text-crimson">{formState.errors.email.message}</p>}
          <Input label="Password" type="password" autoComplete="current-password" {...register("password")} />
          {formState.errors.password && <p role="alert" className="text-xs text-crimson">{formState.errors.password.message}</p>}
          <Button type="submit" className="w-full" loading={formState.isSubmitting}>
            Log in
          </Button>
          {serverError && <p role="alert" className="text-xs text-crimson">{serverError}</p>}
        </form>
        <div className="mt-4 flex justify-between font-tech text-xs uppercase">
          <Link href="/signup" className="underline">Create account</Link>
          <Link href="/forgot-password" className="underline">Forgot password</Link>
        </div>
      </CardBody>
    </Card>
  );
}
