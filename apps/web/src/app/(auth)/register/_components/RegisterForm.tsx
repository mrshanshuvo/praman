'use client';

import { AlertCircle, ArrowRight, Loader2, Lock, Mail, Sparkles, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/providers/AuthProvider';

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      await register(email.trim(), password, name.trim() || undefined);
      router.push('/profile');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-border bg-card/80 backdrop-blur-xl shadow-2xl">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-3">
          <BrandLogo size="md" />
        </div>
        <div className="flex justify-center mb-2">
          <Badge
            variant="outline"
            className="text-brand-cyan bg-brand-cyan/10 border-brand-cyan/30 text-xs gap-1.5 font-medium px-2.5 py-0.5"
          >
            <Sparkles className="w-3 h-3" />
            <span>Create Account</span>
          </Badge>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
          Create your account
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm">
          Build your evidence-backed candidate profile and tailor truthful resumes.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="py-2.5">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                required
                disabled={isSubmitting}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Shahid Hasan"
                className="pl-8 h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                required
                disabled={isSubmitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="pl-8 h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                required
                minLength={8}
                disabled={isSubmitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="pl-8 h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                required
                disabled={isSubmitting}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="pl-8 h-9"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-9 bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-semibold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t border-border py-3">
        <p className="text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className={buttonVariants({
              variant: 'link',
              size: 'xs',
              className: 'text-brand-cyan font-medium p-0 h-auto inline',
            })}
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
