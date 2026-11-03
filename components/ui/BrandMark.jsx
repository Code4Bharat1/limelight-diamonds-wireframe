// Limelight Diamonds cube mark (traced from the brand logo)
export default function BrandMark({ className = 'w-9 h-9' }) {
  return <img src="/logo-mark.svg" alt="Limelight Diamonds" className={`${className} object-contain shrink-0`} />;
}
