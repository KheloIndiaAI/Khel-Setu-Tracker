import Link from 'next/link';

export default function AdminFrame({
  title,
  intro,
  userName,
  showHomeLink,
  children,
}: {
  title: string;
  intro: string;
  userName: string;
  showHomeLink?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen bg-[#F2EEE5] text-[#121519] flex flex-col" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
      <div className="flex items-center gap-7 py-4 px-12 bg-[#121519] text-[#F2EEE5]">
        <div className="font-extrabold text-[26px] tracking-wide uppercase flex-grow" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
          NSDE Delivery &middot; Accounts
        </div>
        {showHomeLink && (
          <Link href="/" className="text-[#F2B33D] text-sm font-semibold hover:text-[#FFD27A]">Home</Link>
        )}
        <span className="text-sm text-[#B9B5AC]">{userName}</span>
      </div>
      <div className="px-12 py-10 max-w-5xl w-full mx-auto flex flex-col gap-6">
        <div>
          <h1 className="font-black text-[44px] uppercase leading-none" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>{title}</h1>
          <p className="text-[15px] text-[#3A3E44] mt-2">{intro}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
