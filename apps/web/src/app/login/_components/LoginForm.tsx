'use client';

import { AlertCircle, ArrowRight, KeyRound, Loader2, Lock, Mail, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      router.push('/profile');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('mrshanshuvo@gmail.com');
    setPassword('Password123!');
    setError(null);
  };

  return (
    <Card className="border-border bg-card/80 backdrop-blur-xl shadow-2xl">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-2">
          <Badge
            variant="outline"
            className="text-brand-cyan bg-brand-cyan/10 border-brand-cyan/30 text-xs gap-1.5 font-medium px-2.5 py-0.5"
          >
            <Sparkles className="w-3 h-3" />
            <span>Truth-Preserving AI</span>
          </Badge>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
          Sign in to <span className="text-brand-cyan font-berkshire">praman</span>
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm">
          Access your verified candidate profile and run AI resume pipelines.
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
                disabled={isSubmitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        <div className="pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={handleFillDemo}
            disabled={isSubmitting}
            className="w-full h-8 border-brand-pink/30 hover:border-brand-pink/60 text-brand-pink bg-brand-pink/5 hover:bg-brand-pink/10 text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Fill Seeded Demo Credentials (Shahid Hasan Shovu)</span>
          </Button>
        </div>
      </CardContent>

      <CardFooter className="justify-center border-t border-border py-3">
        <p className="text-xs text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className={buttonVariants({
              variant: 'link',
              size: 'xs',
              className: 'text-brand-cyan font-medium p-0 h-auto inline',
            })}
          >
            Create an account
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
