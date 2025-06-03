'use client'

import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative w-full max-w-md px-4 z-10">
        <div className="mb-8 text-center">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl mb-4">
              <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">
            Sign in to access your Echo Control Plane
          </p>
        </div>
        
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-8 shadow-2xl">
          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
                card: 'bg-transparent shadow-none border-none p-0',
                headerTitle: 'text-foreground font-bold text-xl',
                headerSubtitle: 'text-muted-foreground',
                socialButtonsBlockButton: 'bg-card hover:bg-card/80 text-card-foreground border border-border/50 hover:border-border transition-all duration-200 shadow-sm hover:shadow-md',
                formFieldInput: 'bg-input/50 border-border/50 text-foreground focus:border-primary focus:ring-primary/20 transition-all duration-200',
                formFieldLabel: 'text-foreground font-medium',
                dividerLine: 'bg-border/30',
                dividerText: 'text-muted-foreground text-sm',
                footerActionLink: 'text-primary hover:text-primary/80 font-medium transition-colors duration-200',
                identityPreviewText: 'text-foreground',
                identityPreviewEditButton: 'text-primary hover:text-primary/80 transition-colors duration-200',
                formFieldInputShowPasswordButton: 'text-muted-foreground hover:text-foreground transition-colors duration-200',
                formButtonReset: 'text-primary hover:text-primary/80 transition-colors duration-200',
                alertText: 'text-destructive text-sm',
                formResendCodeLink: 'text-primary hover:text-primary/80 transition-colors duration-200',
              },
              layout: {
                socialButtonsPlacement: 'top',
                showOptionalFields: false,
              },
              variables: {
                colorPrimary: 'rgb(205, 27, 33)',
                colorText: 'rgb(var(--foreground))',
                colorTextSecondary: 'rgb(var(--muted-foreground))',
                colorBackground: 'transparent',
                colorInputBackground: 'rgb(var(--input))',
                colorInputText: 'rgb(var(--foreground))',
                borderRadius: '0.75rem',
                fontFamily: 'inherit',
              }
            }}
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
          />
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Don't have an account?{' '}
            <a href="/sign-up" className="text-primary hover:text-primary/80 font-medium transition-colors duration-200">
              Sign up here
            </a>
          </p>
        </div>
      </div>
    </main>
  )
} 