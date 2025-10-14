'use client';

import { Suspense } from 'react';

import EntraCallbackPage from './EntraCallbackPage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <EntraCallbackPage />
    </Suspense>
  );
}