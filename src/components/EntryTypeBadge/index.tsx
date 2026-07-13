import React, {type ReactNode} from 'react';
import clsx from 'clsx';

const LABELS: Record<string, string> = {
  pitfall: 'Pitfall',
  decision: 'Decision',
  planned: 'Planned',
};

type Props = {
  entryType?: unknown;
  variant: 'card' | 'page';
};

export default function EntryTypeBadge({entryType, variant}: Props): ReactNode {
  if (typeof entryType !== 'string') {
    return null;
  }
  const label = LABELS[entryType];
  if (!label) {
    return null;
  }
  return (
    <span
      className={clsx(
        'ro-entry-badge',
        `ro-entry-badge--${entryType}`,
        variant === 'card' ? 'ro-entry-badge--card' : 'ro-entry-badge--page',
      )}>
      {label}
    </span>
  );
}
