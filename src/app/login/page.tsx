import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import { auth, signIn } from '@/lib/auth';

// Only same-site relative paths are accepted as a post-login destination.
function safePath(value: unknown): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')
    ? value
    : '/';
}

async function login(formData: FormData) {
  'use server';
  const callbackUrl = safePath(formData.get('callbackUrl'));
  try {
    await signIn('credentials', {
      email: String(formData.get('loginId') ?? '').trim(),
      password: String(formData.get('password') ?? ''),
      redirectTo: callbackUrl,
    });
  } catch (e) {
    if (e instanceof AuthError) {
      redirect('/login?error=1' + (callbackUrl !== '/' ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ''));
    }
    throw e; // includes the redirect thrown on success
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error, callbackUrl } = await searchParams;
  const session = await auth();
  if (session?.user) redirect(safePath(callbackUrl));

  const field = 'w-full h-12 px-4 rounded-xl border border-[#DDD9CE] bg-white focus:outline-none focus:border-[#121519]';

  return (
    <div className="w-full min-h-screen bg-[#F2EEE5] text-[#121519] flex items-center justify-center p-6" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
      <form action={login} className="w-full max-w-sm bg-white rounded-2xl border border-[#DDD9CE] shadow-sm p-8 flex flex-col gap-4">
        <input type="hidden" name="callbackUrl" value={safePath(callbackUrl)} />
        <div className="flex items-start gap-3">
          <svg aria-hidden="true" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
            <rect x="3" y="4" width="18" height="12" rx="2" />
            <path d="M8 20h8M12 16v4" />
          </svg>
          <div className="font-black text-[36px] uppercase leading-none" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>NSDE Delivery</div>
        </div>
        <div className="text-[15px] text-[#3A3E44]">Sign in to continue.</div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="loginId" className="text-[13px] font-bold text-[#5A5E63]">Login ID</label>
          <input id="loginId" name="loginId" className={field} autoComplete="username" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-[13px] font-bold text-[#5A5E63]">Password</label>
          <input id="password" name="password" type="password" className={field} autoComplete="current-password" required />
        </div>
        {error && (
          <div role="alert" className="text-[14px] font-semibold text-[#9E2F24]">
            Sign-in failed. Check your login ID and password. After 5 wrong attempts the account is locked for 15 minutes.
          </div>
        )}
        <button type="submit" className="min-h-[48px] rounded-full bg-[#121519] text-white font-bold text-[15px]">Sign in</button>
      </form>
    </div>
  );
}
