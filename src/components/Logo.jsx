// The Tarot & Tea "Moon Steep" logo: a teacup whose steam becomes a crescent moon.
export default function Logo({ size = 32, className = '' }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}brand/logo.svg`}
      alt=""
      aria-hidden="true"
      className={`logo ${className}`}
      style={{ height: size, width: 'auto' }}
      draggable="false"
    />
  );
}
