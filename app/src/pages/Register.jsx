import { useState } from 'react';
import { Navigate } from 'react-router';
import {
  Alert,
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Link,
  TextField,
} from '@heroui/react';
import AuthLayout from '../components/AuthLayout.jsx';
import ResendVerification from '../components/ResendVerification.jsx';
import AuthCtrl from '../controllers/AuthCtrl.js';
import UserCtrl from '../controllers/UserCtrl.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NAME_FIELDS = [
  {
    name: 'firstName',
    label: 'First name',
    type: 'text',
    autoComplete: 'given-name',
  },
  {
    name: 'lastName',
    label: 'Last name',
    type: 'text',
    autoComplete: 'family-name',
  },
];

const EMAIL_FIELD = {
  name: 'email',
  label: 'Email',
  type: 'email',
  autoComplete: 'email',
};

const FIELD_NAMES = ['firstName', 'lastName', 'email'];

function validate(values) {
  const errors = {};
  if (!values.firstName.trim()) {
    errors.firstName = 'First name is required.';
  }
  if (!values.lastName.trim()) {
    errors.lastName = 'Last name is required.';
  }
  if (!values.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  return errors;
}

export default function Register() {
  const [values, setValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

  if (AuthCtrl.getToken()) {
    return <Navigate to="/" replace />;
  }

  function handleChange(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (formError) setFormError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;

    const nextErrors = validate(values);
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const user = await UserCtrl.register({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
      });
      setRegisteredUser(user);
    } catch (error) {
      // Server errors tied to a field (e.g. EMAIL_TAKEN) show under that
      // field; anything else shows above the button.
      if (FIELD_NAMES.includes(error.field)) {
        setErrors((prev) => ({ ...prev, [error.field]: error.message }));
      } else {
        setFormError(error.message || 'Could not register. Try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderField(field) {
    return (
      <TextField
        key={field.name}
        name={field.name}
        type={field.type}
        autoComplete={field.autoComplete}
        value={values[field.name]}
        onChange={(value) => handleChange(field.name, value)}
        isRequired
        isInvalid={Boolean(errors[field.name])}
        isDisabled={isSubmitting}
        fullWidth
      >
        <Label>{field.label}</Label>
        <Input />
        <FieldError>{errors[field.name]}</FieldError>
      </TextField>
    );
  }

  const signInFooter = (
    <p>
      Already have an account?{' '}
      <Link href="/login" className="font-medium">
        Sign in
      </Link>
    </p>
  );

  if (registeredUser) {
    return (
      <AuthLayout title="Check your email">
        <div className="flex flex-col gap-4">
          <Alert status="success">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Welcome, {registeredUser.firstName}!</Alert.Title>
              <Alert.Description>
                We sent an email to <strong>{registeredUser.email}</strong>.
                Follow the instructions in it to complete your registration.
              </Alert.Description>
            </Alert.Content>
          </Alert>
          <ResendVerification
            email={registeredUser.email}
            hint="Didn't receive it? Check your spam folder, or send it again."
          />
          <Link href="/login" className="self-center font-medium">
            Go to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create account" footer={signInFooter}>
      <Form
        onSubmit={handleSubmit}
        validationBehavior="aria"
        className="flex flex-col gap-4"
      >
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          {NAME_FIELDS.map(renderField)}
        </div>
        {renderField(EMAIL_FIELD)}

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
          fullWidth
          className="mt-2"
          isPending={isSubmitting}
        >
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </Form>
    </AuthLayout>
  );
}
