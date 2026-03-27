import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>): JSX.Element {
  return <button className={cn('btn', className)} {...props} />;
}
