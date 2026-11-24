import { asset } from '../lib/asset';

interface LogoProps {
  className?: string;
}

/** Logo oficial de KOEL Abogados, sin alteraciones. Conserva proporción 512 × 502. */
export function Logo({ className }: LogoProps) {
  return (
    <img
      className={className}
      src={asset('img/koel-logo.png')}
      width={512}
      height={502}
      alt="KOEL Abogados"
      decoding="async"
    />
  );
}
