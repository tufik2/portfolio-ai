import { useState } from 'react';
import { Navigate } from 'react-router';
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Link,
  TextField,
} from '@heroui/react';
import AuthLayout from '../components/AuthLayout.jsx';
import AuthCtrl from '../controllers/AuthCtrl.js';

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

    // TODO: call register API
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
        fullWidth
      >
        <Label>{field.label}</Label>
        <Input />
        <FieldError>{errors[field.name]}</FieldError>
      </TextField>
    );
  }

  return (
    <AuthLayout
      title="Create account"
      footer={
        <p>
          Already have an account?{' '}
          <Link href="/login" className="font-medium">
            Sign in
          </Link>
        </p>
      }
    >
      <Form
        onSubmit={handleSubmit}
        validationBehavior="aria"
        className="flex flex-col gap-4"
      >
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          {NAME_FIELDS.map(renderField)}
        </div>
        {renderField(EMAIL_FIELD)}

        <Button type="submit" fullWidth className="mt-2">
          Create account
        </Button>
      </Form>
    </AuthLayout>
  );
}
