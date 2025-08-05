'use client';

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
              <svg
                className="w-8 h-8 text-primary-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome Back
          </h1>
          <p className="text-muted-foreground">
            Sign in to access your Echo Control Plane
          </p>
        </div>

        <div className="bg-card rounded-lg border border-border p-6 shadow-lg">
          <div className="clerk-container">
            <SignIn
              routing="path"
              path="/sign-in"
              signUpUrl="/sign-up"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'bg-transparent border-none shadow-none',
                  headerTitle: 'hidden',
                  headerSubtitle: 'hidden',
                  socialButtonsBlockButton:
                    'bg-input hover:bg-accent text-foreground border border-border rounded-md h-10 text-sm font-medium transition-colors',
                  socialButtonsBlockButtonText: 'text-foreground font-medium',
                  dividerLine: 'bg-border',
                  dividerText: 'text-muted-foreground text-sm',
                  formFieldLabel: 'text-foreground text-sm font-medium',
                  formFieldInput:
                    'bg-input border border-border text-foreground rounded-md h-10 px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
                  formButtonPrimary:
                    'bg-primary hover:bg-primary/90 text-primary-foreground rounded-md h-10 px-4 text-sm font-medium transition-colors w-full',
                  footerActionLink:
                    'text-primary hover:text-primary/80 text-sm font-medium',
                  identityPreviewText: 'text-foreground',
                  identityPreviewEditButton:
                    'text-primary hover:text-primary/80',
                  formFieldSuccessText: 'text-emerald-600',
                  formFieldErrorText: 'text-destructive text-sm',
                  alert:
                    'border border-border bg-card text-foreground rounded-md',
                  alertText: 'text-foreground text-sm',
                  formFieldInputShowPasswordButton:
                    'text-muted-foreground hover:text-foreground',
                  otpCodeFieldInput:
                    'bg-input border border-border text-foreground rounded-md h-10 w-10 text-center text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
                  formHeaderTitle: 'text-foreground text-lg font-semibold',
                  formHeaderSubtitle: 'text-muted-foreground text-sm',
                },
                layout: {
                  socialButtonsPlacement: 'top',
                  showOptionalFields: false,
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Custom CSS to override any remaining Clerk styles */}
      <style jsx global>{`
        .clerk-container .cl-internal-b3fm6y {
          width: 100% !important;
          max-width: none !important;
        }

        .clerk-container .cl-card {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }

        .clerk-container .cl-main {
          width: 100% !important;
        }

        .clerk-container .cl-footer {
          background: transparent !important;
        }

        .clerk-container .cl-socialButtonsBlockButton {
          width: 100% !important;
          justify-content: center !important;
        }

        .clerk-container .cl-formButtonPrimary {
          width: 100% !important;
        }

        .clerk-container .cl-formField {
          margin-bottom: 1rem !important;
        }

        .clerk-container .cl-divider {
          margin: 1.5rem 0 !important;
        }

        .clerk-container .cl-footer {
          margin-top: 1.5rem !important;
        }

        /* Ensure proper spacing and layout */
        .clerk-container .cl-rootBox {
          width: 100% !important;
        }

        /* Hide any development mode indicators */
        .clerk-container .cl-developerModeTag {
          display: none !important;
        }
      `}</style>
    </main>
  );
}
