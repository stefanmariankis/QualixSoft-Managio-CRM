import { FC } from 'react';
import { PasswordStrength as PasswordStrengthEnum } from '@/types';

interface PasswordStrengthProps {
  strength: PasswordStrengthEnum;
}

const PasswordStrength: FC<PasswordStrengthProps> = ({ strength }) => {
  let weakColor = 'bg-gray-200';
  let mediumColor = 'bg-gray-200';
  let strongColor = 'bg-gray-200';
  let strengthText = 'Putere parolă: slabă';
  
  switch (strength) {
    case PasswordStrengthEnum.WEAK:
      weakColor = 'bg-red-500';
      strengthText = 'Putere parolă: slabă';
      break;
    case PasswordStrengthEnum.MEDIUM:
      weakColor = 'bg-yellow-500';
      mediumColor = 'bg-yellow-500';
      strengthText = 'Putere parolă: medie';
      break;
    case PasswordStrengthEnum.STRONG:
      weakColor = 'bg-green-500';
      mediumColor = 'bg-green-500';
      strongColor = 'bg-green-500';
      strengthText = 'Putere parolă: puternică';
      break;
  }
  
  return (
    <div className="space-y-1">
      <div className="flex">
        <div className={`h-1 w-1/3 rounded-l-full ${weakColor}`}></div>
        <div className={`h-1 w-1/3 ${mediumColor}`}></div>
        <div className={`h-1 w-1/3 rounded-r-full ${strongColor}`}></div>
      </div>
      <p className="text-xs text-gray-500">{strengthText}</p>
    </div>
  );
};

export default PasswordStrength;
