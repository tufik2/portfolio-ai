import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import {
  Alert,
  Button,
  FieldError,
  Form,
  Input,
  InputOTP,
  Label,
  Link,
  TextField,
} from '@heroui/react';
import AuthLayout from '../components/AuthLayout.jsx';
import ResendVerification from '../components/ResendVerification.jsx';
import AuthCtrl from '../controllers/AuthCtrl.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_LENGTH = 6;
const CODE_TTL_MINUTES = 10;

// "4:32" for the resend countdown.
function formatRemaining(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function ErrorAlert({ message }) {
  if (!message) return null;
  return (
    <Alert status="danger" className="w-full">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Description>{message}</Alert.Description>
      </Alert.Content>
    </Alert>
  );
}

export default function Login() {
  const navigate = useNavigate();

  // 'email' | 'code'
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [code, setCode] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendAt, setResendAt] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [showVerifyHelp, setShowVerifyHelp] = useState(false);

  // Ticks once a second while the resend countdown is running.
  useEffect(() => {
    if (!resendAt || resendAt.getTime() <= Date.now()) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [resendAt]);

  if (AuthCtrl.getToken()) {
    return <Navigate to="/" replace />;
  }

  const remainingMs = resendAt ? resendAt.getTime() - now : 0;
  const canResend = remainingMs <= 0;
  const address = email.trim();

  async function sendCode({ isResend = false } = {}) {
    setFormError('');
    setNotice('');
    setIsSending(true);
    try {
      const availableAt = await AuthCtrl.requestLoginCode(address);
      setResendAt(availableAt);
      setNow(Date.now());
      setCode('');
      setStep('code');
      if (isResend) setNotice('We sent a new code.');
    } catch (error) {
      if (error.field === 'email') {
        setStep('email');
        setEmailError(error.message);
      } else {
        setFormError(error.message || 'Could not send the code. Try again.');
      }
    } finally {
      setIsSending(false);
    }
  }

  function handleEmailSubmit(event) {
    event.preventDefault();
    if (isSending) return;
    if (!address) return setEmailError('Email is required.');
    if (!EMAIL_PATTERN.test(address)) {
      return setEmailError('Enter a valid email address.');
    }
    sendCode();
  }

  async function verify(value = code) {
    if (isVerifying) return;
    if (value.length !== CODE_LENGTH) {
      setFormError('Enter the 6-digit code.');
      return;
    }
    setFormError('');
    setNotice('');
    setIsVerifying(true);
    try {
      await AuthCtrl.verifyLoginCode(address, value);
      navigate('/', { replace: true });
    } catch (error) {
      setCode('');
      setFormError(error.message || 'Could not verify the code. Try again.');
      setIsVerifying(false);
    }
  }

  function handleCodeSubmit(event) {
    event.preventDefault();
    verify();
  }

  function useDifferentEmail() {
    setStep('email');
    setCode('');
    setFormError('');
    setNotice('');
    setShowVerifyHelp(false);
  }

  const footer = (
    <p>
      Don&apos;t have an account?{' '}
      <Link href="/register" className="font-medium">
        Register
      </Link>
    </p>
  );

  if (step === 'email') {
    return (
      <AuthLayout title="Sign in" footer={footer}>
        <Form
          onSubmit={handleEmailSubmit}
          validationBehavior="aria"
          className="flex flex-col gap-4"
        >
          <TextField
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(value) => {
              setEmail(value);
              if (emailError) setEmailError('');
              if (formError) setFormError('');
            }}
            isRequired
            isInvalid={Boolean(emailError)}
            isDisabled={isSending}
            fullWidth
          >
            <Label>Email</Label>
            <Input />
            <FieldError>{emailError}</FieldError>
          </TextField>

          <ErrorAlert message={formError} />

          <Button type="submit" fullWidth className="mt-2" isPending={isSending}>
            {isSending ? 'Sending code…' : 'Send code'}
          </Button>
        </Form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Enter your code" footer={footer}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          We sent a 6-digit code to{' '}
          <strong className="text-foreground">{address}</strong>. It expires in{' '}
          {CODE_TTL_MINUTES} minutes.
        </p>
        <Form
          onSubmit={handleCodeSubmit}
          validationBehavior="aria"
          className="flex flex-col gap-4 justify-center"
        >
          <InputOTP
            aria-label="6-digit code"
            className="justify-center"
            maxLength={CODE_LENGTH}
            value={code}
            onChange={(value) => {
              setCode(value.replace(/\D/g, ''));
              if (formError) setFormError('');
            }}
            onComplete={(value) => verify(value)}
            pattern="^\d*$"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            isDisabled={isVerifying}
            isInvalid={Boolean(formError)}
          >
            <InputOTP.Group>
              {Array.from({ length: CODE_LENGTH }, (_, index) => (
                <InputOTP.Slot key={index} index={index} />
              ))}
            </InputOTP.Group>
          </InputOTP>

          <ErrorAlert message={formError} />

          {notice && (
            <Alert status="success" className="w-full">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>{notice}</Alert.Description>
              </Alert.Content>
            </Alert>
          )}

          <Button type="submit" fullWidth isPending={isVerifying}>
            {isVerifying ? 'Verifying…' : 'Verify'}
          </Button>
        </Form>

        <div className="flex flex-col gap-2">
          <Button
            variant="secondary"
            fullWidth
            isDisabled={!canResend || isVerifying}
            isPending={isSending}
            onPress={() => sendCode({ isResend: true })}
          >
            {isSending
              ? 'Sending…'
              : canResend
                ? 'Resend code'
                : `Resend code in ${formatRemaining(remainingMs)}`}
          </Button>
          <Button
            variant="ghost"
            fullWidth
            isDisabled={isVerifying}
            onPress={useDifferentEmail}
          >
            Use a different email
          </Button>
        </div>

        <div className="flex flex-col gap-2 text-sm text-muted">
          <p>
            Didn&apos;t get a code? Only verified accounts can sign in. If you
            just registered, verify your email first.{' '}
            {!showVerifyHelp && (
              <Link
                className="font-medium"
                onPress={() => setShowVerifyHelp(true)}
              >
                Resend verification email
              </Link>
            )}
          </p>
          {showVerifyHelp && <ResendVerification email={address} />}
        </div>
      </div>
    </AuthLayout>
  );
}
