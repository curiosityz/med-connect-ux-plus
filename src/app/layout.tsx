import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton
} from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BriefcaseMedical, LogIn, UserPlus, SearchCode, DollarSign } from 'lucide-react';
import { Toaster } from 'react-hot-toast';


const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'RX Prescribers',
  description: 'Effortlessly find medical prescribers by medication, zipcode, and radius.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
          <div className="min-h-screen flex flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-16 items-center">
                <Link href="/" className="mr-6 flex items-center space-x-2">
                  <BriefcaseMedical className="h-7 w-7 text-primary" />
                  <span className="font-bold text-xl sm:inline-block">
                    RX Prescribers
                  </span>
                </Link>
                <nav className="flex-1 items-center space-x-4 hidden md:flex">
                  <SignedIn>
                    <Link href="/finder" passHref>
                      <Button variant="ghost" className="text-foreground/80 hover:text-foreground">
                        <SearchCode className="mr-2 h-4 w-4" />
                        Finder App
                      </Button>
                    </Link>
                  </SignedIn>
                  <Link href="/pricing" passHref>
                    <Button variant="ghost" className="text-foreground/80 hover:text-foreground">
                      <DollarSign className="mr-2 h-4 w-4" />
                      Pricing
                    </Button>
                  </Link>
                </nav>
                <div className="flex items-center justify-end space-x-2 md:space-x-4 ml-auto">
                  <SignedIn>
                    <UserButton afterSignOutUrl="/" />
                  </SignedIn>
                  <SignedOut>
                    <SignInButton mode="modal">
                      <Button variant="ghost">
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In
                      </Button>
                    </SignInButton>
                    <Link href="/sign-up" passHref>
                      <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Sign Up
                      </Button>
                    </Link>
                  </SignedOut>
                </div>
              </div>
            </header>
            <main className="flex-1">
              {children}
            </main>
            <Toaster position="top-center" />
            <footer className="bg-background border-t">
              <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <BriefcaseMedical className="h-6 w-6 text-primary" />
                      <span className="font-bold text-lg">RX Prescribers</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Connecting healthcare professionals with the right prescribers, efficiently and accurately.
                    </p>
                    <div className="flex space-x-4">
                      <Button variant="ghost" size="sm">
                        <span className="sr-only">Twitter</span>
                        🐦
                      </Button>
                      <Button variant="ghost" size="sm">
                        <span className="sr-only">LinkedIn</span>
                        💼
                      </Button>
                      <Button variant="ghost" size="sm">
                        <span className="sr-only">Facebook</span>
                        📘
                      </Button>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-4">Product</h3>
                    <div className="space-y-2 text-sm">
                      <Link href="/finder" className="block text-muted-foreground hover:text-primary transition-colors">Prescriber Search</Link>
                      <Link href="/pricing" className="block text-muted-foreground hover:text-primary transition-colors">Pricing Plans</Link>
                      <Link href="#" className="block text-muted-foreground hover:text-primary transition-colors">API Access</Link>
                      <Link href="#" className="block text-muted-foreground hover:text-primary transition-colors">Mobile App</Link>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-4">Support</h3>
                    <div className="space-y-2 text-sm">
                      <Link href="#" className="block text-muted-foreground hover:text-primary transition-colors">Help Center</Link>
                      <Link href="#" className="block text-muted-foreground hover:text-primary transition-colors">Contact Us</Link>
                      <Link href="#" className="block text-muted-foreground hover:text-primary transition-colors">System Status</Link>
                      <Link href="#" className="block text-muted-foreground hover:text-primary transition-colors">Training</Link>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-4">Legal</h3>
                    <div className="space-y-2 text-sm">
                      <Link href="/privacy" className="block text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
                      <Link href="/terms" className="block text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
                      <Link href="#" className="block text-muted-foreground hover:text-primary transition-colors">HIPAA Compliance</Link>
                      <Link href="#" className="block text-muted-foreground hover:text-primary transition-colors">Data Security</Link>
                    </div>
                  </div>
                </div>
                <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
                  <p>© {new Date().getFullYear()} RX Prescribers. All rights reserved. | Built with ❤️ for healthcare professionals.</p>
                </div>
              </div>
            </footer>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
