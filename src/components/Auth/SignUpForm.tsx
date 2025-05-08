import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const SignUpForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signUp, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords don't match.");
      return;
    }
    if (!email || !password) {
      alert('Please fill in all fields.');
      return;
    }
    
    const { error: signUpError } = await signUp({ email, password });

    if (!signUpError) {
      alert('Sign up successful! Please check your email to confirm your account.');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email-signup">Email</Label>
        <Input
          id="email-signup"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          disabled={loading}
        />
      </div>
      <div>
        <Label htmlFor="password-signup">Password</Label>
        <Input
          id="password-signup"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={loading}
        />
      </div>
      <div>
        <Label htmlFor="confirm-password-signup">Confirm Password</Label>
        <Input
          id="confirm-password-signup"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={loading}
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error.message}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Signing Up...' : 'Sign Up'}
      </Button>
    </form>
  );
};