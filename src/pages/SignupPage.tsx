import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAuthErrorMessage } from '../lib/utils';
import Footer from '../components/Footer';

import { Logo } from '../components/Logo';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    // Basic email validation
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return toast.error('Please enter a valid email address');
    }
    
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters long');
    }
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    
    setLoading(true);
    const loadingToast = toast.loading('Creating your account...');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      const user = userCredential.user;
      
      // Create user profile in Firestore
      const now = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(now.getDate() + 30);

      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: 'admin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        subscription: {
          planType: 'trial',
          billsUsed: 0,
          billLimit: 'unlimited',
          trialStartDate: serverTimestamp(),
          trialEndDate: Timestamp.fromDate(trialEndDate),
          updatedAt: serverTimestamp()
        }
      });
      
      toast.dismiss(loadingToast);
      toast.success('Account created successfully');
      navigate('/dashboard');
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error('Signup error:', error);
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    const loadingToast = toast.loading('Signing in with Google...');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user profile exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        // Create profile for new Google user
        const now = new Date();
        const trialEndDate = new Date();
        trialEndDate.setDate(now.getDate() + 30);

        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          role: 'admin',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          subscription: {
            planType: 'trial',
            billsUsed: 0,
            billLimit: 'unlimited',
            trialStartDate: serverTimestamp(),
            trialEndDate: Timestamp.fromDate(trialEndDate),
            updatedAt: serverTimestamp()
          }
        });
      }
      
      toast.dismiss(loadingToast);
      toast.success('Signed in with Google');
      navigate('/dashboard');
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error('Google sign-in error:', error);
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex flex-grow flex-col items-center justify-center p-4">
        <Link to="/" className="mb-8">
          <Logo iconClassName="h-16 w-16 rounded-2xl" textClassName="text-2xl" />
        </Link>
        <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
          <CardDescription>Start managing your dental clinic billing today</CardDescription>
          <div className="mt-2 text-[10px] font-bold text-blue-600 bg-blue-50 py-1 px-3 rounded-full inline-block mx-auto uppercase tracking-widest border border-blue-100">
            30 Days Free Unlimited Trial
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="doctor@clinic.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
              <p className="text-[10px] text-gray-500">Minimum 6 characters</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required 
              />
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign Up'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleGoogleSignIn}
            disabled={loading}
            type="button"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>
        </CardContent>
        <CardFooter>
          <p className="w-full text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
      </div>
      <Footer />
    </div>
  );
}
