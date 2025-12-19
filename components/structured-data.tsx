import React from 'react';

interface Props {
  script: object;
}

export function StructuredData({ script }: Props) {
  return (
    // eslint-disable-next-line react/no-danger
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(script) }} />
  );
}

export default StructuredData;
