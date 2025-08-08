import { SignInForm } from '../_components/form';

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { redirect_url } = await searchParams;

  const redirectTo =
    redirect_url && typeof redirect_url === 'string' ? redirect_url : undefined;

  return <SignInForm redirectUrl={redirectTo} isSignUp={true} />;
}
