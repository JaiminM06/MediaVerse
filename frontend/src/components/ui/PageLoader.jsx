import { Loader2 } from 'lucide-react';

export default function PageLoader({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3" role="status" aria-live="polite">
      <Loader2 className="animate-spin text-brand-600" size={36} aria-hidden="true" />
      <span className="text-sm text-slate-500 font-medium">{label}</span>
    </div>
  );
}
