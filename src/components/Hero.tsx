'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nProvider';

export default function Hero() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 p-6 sm:p-10">
      <div className="glass absolute inset-0 -z-10" />
      <div className="grid items-center gap-6 sm:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col gap-4"
        >
          <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs opacity-80">
            {t('hero.tagline')}
          </span>
          <h1 className="text-3xl font-bold leading-tight text-gradient sm:text-4xl">
            {t('hero.title')}
          </h1>
          <p className="text-sm opacity-75">{t('hero.subtitle')}</p>
          <div className="mt-1 flex flex-wrap gap-3">
            <a
              href="#campaigns"
              className="rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 text-sm font-medium text-white"
            >
              {t('hero.ctaExplore')}
            </a>
            <Link
              href="/create"
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium"
            >
              {t('hero.ctaCreate')}
            </Link>
          </div>
        </motion.div>

        <MoneyArc />
      </div>
    </section>
  );
}

/** Animated cross-border money-flow arc (Germany → Kenya). */
function MoneyArc() {
  return (
    <motion.svg
      viewBox="0 0 320 200"
      className="h-44 w-full sm:h-56"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <defs>
        <linearGradient id="arc" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="60%" stopColor="#e879f9" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <radialGradient id="glow">
          <stop offset="0%" stopColor="rgba(232,121,249,0.5)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* faint globe */}
      <circle cx="160" cy="110" r="92" fill="url(#glow)" opacity="0.25" />
      <ellipse cx="160" cy="110" rx="92" ry="92" fill="none" stroke="white" strokeOpacity="0.08" />
      <ellipse cx="160" cy="110" rx="40" ry="92" fill="none" stroke="white" strokeOpacity="0.06" />
      <line x1="68" y1="110" x2="252" y2="110" stroke="white" strokeOpacity="0.06" />

      {/* flowing arc */}
      <path
        d="M70 150 Q160 10 250 90"
        fill="none"
        stroke="url(#arc)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="6 10"
        style={{ animation: 'float-dash 14s linear infinite' }}
      />

      {/* endpoints */}
      <Endpoint cx={70} cy={150} label="DE" />
      <Endpoint cx={250} cy={90} label="KE" />

      {/* travelling coin */}
      <motion.circle
        r="5"
        fill="#fde68a"
        stroke="#f59e0b"
        strokeWidth="1"
        animate={{
          cx: [70, 160, 250],
          cy: [150, 40, 90],
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.svg>
  );
}

function Endpoint({ cx, cy, label }: { cx: number; cy: number; label: string }) {
  return (
    <g>
      <motion.circle
        cx={cx}
        cy={cy}
        r="6"
        fill="#a78bfa"
        animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0.3, 0.8] }}
        transition={{ duration: 2.4, repeat: Infinity }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      <circle cx={cx} cy={cy} r="3" fill="white" />
      <text x={cx} y={cy - 12} textAnchor="middle" fontSize="9" fill="white" opacity="0.7">
        {label}
      </text>
    </g>
  );
}
