'use client';

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Join Echo</h1>
          <p className="text-muted-foreground">
            Create your account to start building with Echo
          </p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6 shadow-lg">
          <SignUp
            appearance={{
              elements: {
                formButtonPrimary:
                  'bg-primary hover:bg-primary/90 text-primary-foreground',
                card: 'bg-transparent shadow-none border-none',
                headerTitle: 'text-foreground',
                headerSubtitle: 'text-muted-foreground',
                socialButtonsBlockButton:
                  'bg-secondary hover:bg-secondary/90 text-secondary-foreground border border-border',
                formFieldInput: 'bg-input border-border text-foreground',
                formFieldLabel: 'text-foreground',
                dividerLine: 'bg-border',
                dividerText: 'text-muted-foreground',
                footerActionLink: 'text-primary hover:text-primary/90',
                identityPreviewText: 'text-foreground',
                identityPreviewEditButton: 'text-primary hover:text-primary/90',
              },
              layout: {
                socialButtonsPlacement: 'top',
                showOptionalFields: false,
              },
            }}
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
          />
        </div>
      </div>
    </main>
  );
}
