export default function Header() {
  return (
    <header className="border-b border-border bg-primary-secondary">
      <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-xl font-bold">VideoClean</span>
          </div>
          <span className="text-sm px-3 py-1 rounded bg-primary-tertiary text-text-secondary">
            专业版
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a
            href="https://ps.909939.xyz/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-text-secondary hover:text-accent transition-colors duration-200"
          >
            图片处理
          </a>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <StatusDot />
            <span>系统就绪</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#0099cc" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#logo-gradient)" />
      <path
        d="M16 8L22 16L16 24L10 16L16 8Z"
        fill="white"
        fillOpacity="0.9"
      />
    </svg>
  );
}

function StatusDot() {
  return (
    <span className="status-dot w-2 h-2 rounded-full bg-success inline-block mr-2 shadow-[0_0_10px_var(--color-success)]" />
  );
}
