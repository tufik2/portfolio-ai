import { Card } from '@heroui/react';

export default function AuthLayout({ title, children, footer }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-sm p-6 sm:max-w-md sm:p-8">
        <Card.Header>
          <Card.Title className="text-2xl font-bold">{title}</Card.Title>
        </Card.Header>

        <Card.Content>{children}</Card.Content>

        {footer && (
          <Card.Footer className="justify-center text-sm text-muted">
            {footer}
          </Card.Footer>
        )}
      </Card>
    </main>
  );
}
