import React, {type ReactNode} from 'react';
import OriginalDocItemContent from '@theme-original/DocItem/Content';
import type ContentType from '@theme/DocItem/Content';
import type {WrapperProps} from '@docusaurus/types';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import EntryTypeBadge from '@site/src/components/EntryTypeBadge';

type Props = WrapperProps<typeof ContentType>;

export default function DocItemContentWrapper(props: Props): ReactNode {
  const {frontMatter} = useDoc();
  const entryType = (
    frontMatter.sidebar_custom_props as {entry_type?: unknown} | undefined
  )?.entry_type;

  return (
    <>
      <EntryTypeBadge entryType={entryType} variant="page" />
      <OriginalDocItemContent {...props} />
    </>
  );
}
