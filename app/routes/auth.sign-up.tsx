import {
  Anchor,
  Button,
  Fieldset,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  LoaderFunctionArgs,
  json,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { Form, NavLink, useActionData, useNavigation } from "@remix-run/react";
import { useEffect } from "react";

import { AUTH_STRATEGY_NAME, authenticator } from "../lib/auth.server";
import { CreateUserSchema, createUser } from "../lib/user.server";
import { commonActionData } from "../utils";

export default function SignUp() {
  const actionData = useActionData<typeof action>();
  const validationErrors = actionData?.validationErrors;

  const submitting = useNavigation().state === "submitting";

  useEffect(() => {
    if (actionData?.error) {
      notifications.show({
        title: actionData.error,
        message: null,
        color: "red",
        autoClose: false,
      });
    }
  }, [actionData?.error]);

  return (
    <>
      <Text ta="center">Sign Up</Text>
      <Form method="post">
        <Stack
          renderRoot={(props) => (
            <Fieldset disabled={submitting} variant="unstyled" {...props} />
          )}
          py="sm"
        >
          <TextInput
            name="name"
            label="Username"
            placeholder="Enter a username with 4 to 20 alphanumeric characters."
            withAsterisk
            error={validationErrors?.name && validationErrors.name[0]}
          />
          <TextInput
            name="password"
            type="password"
            label="Password"
            placeholder="Enter a password with 8 to 20 alphanumeric characters and symbols."
            withAsterisk
            error={validationErrors?.password && validationErrors.password[0]}
          />
          <Button type="submit" fullWidth>
            Sign Up
          </Button>
          <Anchor
            ta="center"
            renderRoot={(props) => <NavLink to="/auth/sign-in" {...props} />}
          >
            Already have an account? Sign In here.
          </Anchor>
        </Stack>
      </Form>
    </>
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  return await authenticator.isAuthenticated(request, {
    successRedirect: "/todos/incomplete",
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const cloneRequest = request.clone();
  const formDataObj = Object.fromEntries(await cloneRequest.formData());

  const validated = CreateUserSchema.safeParse(formDataObj);
  if (!validated.success) {
    return json({
      ...commonActionData,
      validationErrors: validated.error.flatten().fieldErrors,
    });
  }

  const result = await createUser(validated.data);
  if (result?.error) {
    return json({
      ...commonActionData,
      error: result.error,
    });
  }

  return await authenticator.authenticate(AUTH_STRATEGY_NAME, request, {
    successRedirect: "/todos/incomplete",
  });
}
