import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export function Checkbox({ className, ...props }: InputHTMLAttributes<HTMLInputElement>): JSX.Element {
  return <input type="checkbox" className={cn('checkbox', className)} {...props} />;
}
