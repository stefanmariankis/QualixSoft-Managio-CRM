import { FC } from 'react';

const Logo: FC = () => {
  return (
    <svg className="w-10 h-10 text-primary" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
    </svg>
  );
};

export default Logo;
