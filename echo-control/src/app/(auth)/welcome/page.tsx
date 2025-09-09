import Coupon from '@/components/coupon';

export default function WelcomePage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full">
      <h1 className="text-3xl font-bold">Welcome</h1>
      <p className="text-md text-muted-foreground/80 max-w-sm">
        We sent you an email with a link to verify your email address.
      </p>
      <Coupon />
    </div>
  );
}
