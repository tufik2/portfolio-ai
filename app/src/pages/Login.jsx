import { useState } from 'react';
import { Navigate } from 'react-router';
import {
  Button,
  Card,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
} from '@heroui/react';
import AuthCtrl from '../controllers/AuthCtrl.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIELDS = [
  {
    name: 'communityCode',
    label: 'Community code',
    type: 'text',
    autoComplete: 'organization',
  },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    autoComplete: 'current-password',
  },
];

function validate(values) {
  const errors = {};
  if (!values.communityCode.trim()) {
    errors.communityCode = 'Community code is required.';
  }
  if (!values.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (!values.password) {
    errors.password = 'Password is required.';
  }
  return errors;
}

export default function Login() {
  const [values, setValues] = useState({
    communityCode: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  if (AuthCtrl.getToken()) {
    return <Navigate to="/" replace />;
  }

  function handleChange(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // TODO: call login API
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm p-6 sm:p-8">
        <Card.Header>
          <Card.Title className="text-2xl font-bold">Sign in</Card.Title>
        </Card.Header>

        <Card.Content>
          <Form
            onSubmit={handleSubmit}
            validationBehavior="aria"
            className="flex flex-col gap-4"
          >
            {FIELDS.map((field) => (
              <TextField
                key={field.name}
                name={field.name}
                type={field.type}
                autoComplete={field.autoComplete}
                value={values[field.name]}
                onChange={(value) => handleChange(field.name, value)}
                isRequired
                isInvalid={Boolean(errors[field.name])}
                fullWidth
              >
                <Label>{field.label}</Label>
                <Input />
                <FieldError>{errors[field.name]}</FieldError>
              </TextField>
            ))}

            <Button type="submit" fullWidth className="mt-2">
              Sign in
            </Button>
          </Form>
        </Card.Content>
      </Card>
    </main>
  );
}
