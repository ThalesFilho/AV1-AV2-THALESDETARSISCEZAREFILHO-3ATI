export default function EmptyState({ title, children, action }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
      <svg className="mx-auto size-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
      <h3 className="mt-3 text-base font-medium text-gray-900">{title}</h3>
      {children && <p className="mt-1 text-sm text-gray-500">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
