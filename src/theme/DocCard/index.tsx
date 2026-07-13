import React, {type ReactNode} from 'react';
import OriginalDocCard from '@theme-original/DocCard';
import type DocCardType from '@theme/DocCard';
import type {WrapperProps} from '@docusaurus/types';
import EntryTypeBadge from '@site/src/components/EntryTypeBadge';

type Props = WrapperProps<typeof DocCardType>;

export default function DocCardWrapper(props: Props): ReactNode {
  const {item} = props;
  const entryType =
    item.type === 'link'
      ? (item.customProps?.entry_type as unknown)
      : undefined;

  return (
    <div className="ro-doc-card-wrapper">
      <OriginalDocCard {...props} />
      <EntryTypeBadge entryType={entryType} variant="card" />
    </div>
  );
}
