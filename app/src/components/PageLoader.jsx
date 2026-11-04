import { Spinner } from '@heroui/react';

export default function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner aria-label="Loading page" />
    </div>
  );
}
