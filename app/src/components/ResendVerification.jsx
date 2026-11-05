import { useState } from 'react';
import {
  Alert,
  Button,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
} from '@heroui/react';
import UserCtrl from '../controllers/UserCtrl.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Resends the verification email.
 * - With `email`: shows a single "Resend email" button for that address.
 * - Without `email`: shows an email field and a "Send new link" button.
 */
export default function ResendVerification({ email: knownEmail }) {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSending) return;

    const address = (knownEmail ?? email).trim();
    if (!knownEmail) {
      if (!address) return setFieldError('Email is required.');
      if (!EMAIL_PATTERN.test(address)) {
        return setFieldError('Enter a valid email address.');
      }
    }

    setIsSending(true);
    setFormError('');
    try {
      await UserCtrl.resendVerificationEmail(address);
      setSent(true);
    } catch (error) {
      if (error.field === 'email' && !knownEmail) {
        setFieldError(error.message);
      } else {
        setFormError(error.message || 'Could not resend the email.');
      }
    } finally {
      setIsSending(false);
    }
  }

  if (sent) {
    return (
      <Alert status="success">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Description>
            {knownEmail
              ? `We sent a new verification link to ${knownEmail}. Earlier links no longer work.`
              : 'If that email is waiting for verification, we sent it a new link. Earlier links no longer work.'}
          </Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }

  return (
    <Form
      onSubmit={handleSubmit}
      validationBehavior="aria"
      className="flex flex-col gap-3"
    >
      {!knownEmail && (
        <TextField
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(value) => {
            setEmail(value);
            if (fieldError) setFieldError('');
          }}
          isRequired
          isInvalid={Boolean(fieldError)}
          isDisabled={isSending}
          fullWidth
        >
          <Label>Email</Label>
          <Input />
          <FieldError>{fieldError}</FieldError>
        </TextField>
      )}

      {formError && (
        <Alert status="danger" className="w-full">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{formError}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <Button
        type="submit"
        variant={knownEmail ? 'secondary' : 'primary'}
        fullWidth
        isPending={isSending}
      >
        {isSending
          ? 'Sending…'
          : knownEmail
            ? 'Resend email'
            : 'Send new link'}
      </Button>
    </Form>
  );
}
