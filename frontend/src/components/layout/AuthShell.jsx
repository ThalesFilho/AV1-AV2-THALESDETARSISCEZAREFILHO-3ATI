import Footer from "./Footer.jsx";

// Moldura das telas de login e cadastro (centralizadas, sem navbar).
export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center text-teal-700">
            <svg className="mx-auto size-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="mt-1 text-xl font-bold">EstoqueFácil</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-xs sm:p-8">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="mt-1 mb-6 text-sm text-gray-500">{subtitle}</p>
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
