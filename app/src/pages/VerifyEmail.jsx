import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Alert, Link, Spinner } from '@heroui/react';
import AuthLayout from '../components/AuthLayout.jsx';
import ResendVerification from '../components/ResendVerification.jsx';
import UserCtrl from '../controllers/UserCtrl.js';

const MISSING_TOKEN = 'This verification link is missing a token.';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  // 'verifying' | 'verified' | 'error'
  const [state, setState] = useState(token ? 'verifying' : 'error');
  const [user, setUser] = useState(null);
  const [error, setError] = useState(token ? '' : MISSING_TOKEN);

  // The token is single-use. React StrictMode runs effects twice in
  // development, so make sure the request is only sent once.
  const requested = useRef(false);

  useEffect(() => {
    if (!token || requested.current) return;
    requested.current = true;

    UserCtrl.verifyEmail(token)
      .then((verifiedUser) => {
        setUser(verifiedUser);
        setState('verified');
      })
      .catch((err) => {
        setError(err.message || 'Could not verify your email. Try again.');
        setState('error');
      });
  }, [token]);

  if (state === 'verifying') {
    return (
      <AuthLayout title="Verifying your email">
        <div className="flex flex-col items-center gap-3 py-4">
          <Spinner aria-label="Verifying email" />
          <p className="text-sm text-muted">This only takes a moment…</p>
        </div>
      </AuthLayout>
    );
  }

  if (state === 'verified') {
    return (
      <AuthLayout title="Email verified">
        <div className="flex flex-col gap-4">
          <Alert status="success">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Thanks, {user.firstName}!</Alert.Title>
              <Alert.Description>
                Your email <strong>{user.email}</strong> is verified. You can
                now sign in.
              </Alert.Description>
            </Alert.Content>
          </Alert>
          <Link href="/login" className="self-center font-medium">
            Go to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Verification failed">
      <div className="flex flex-col gap-4">
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">
            Still need to verify your email? Enter it below and we&apos;ll send
            you a new link.
          </p>
          <ResendVerification />
        </div>
        <Link href="/login" className="self-center font-medium">
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
