import {
  Anchor,
  Button,
  Fieldset,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { Form, NavLink, useActionData, useNavigation } from "@remix-run/react";
import { useEffect } from "react";
import { AuthorizationError } from "remix-auth";

import {
  AUTH_STRATEGY_NAME,
  AuthSchema,
  authenticator,
} from "../lib/auth.server";
import { ERROR_MESSAGES, commonActionData } from "../utils";

export default function SignIn() {
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
      <Text ta="center">Sign In</Text>
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
            placeholder="Enter a username with 4-20 alphanumeric characters."
            withAsterisk
            error={validationErrors?.name && validationErrors.name[0]}
          />
          <TextInput
            name="password"
            type="password"
            label="Password"
            placeholder="Enter a password with 8-20 alphanumeric characters and symbols."
            withAsterisk
            error={validationErrors?.password && validationErrors.password[0]}
          />
          <Button type="submit" fullWidth>
            Sign In
          </Button>
          <Anchor
            ta="center"
            renderRoot={(props) => <NavLink to="/auth/sign-up" {...props} />}
          >
            Sign Up Here
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
  // The request is used for both validation and authentication.
  // Calling request.formData() multiple times will result in an error, so we clone it to avoid that.
  const cloneRequest = request.clone();
  const formDataObj = Object.fromEntries(await cloneRequest.formData());

  const validated = AuthSchema.safeParse(formDataObj);
  if (!validated.success) {
    return json({
      ...commonActionData,
      validationErrors: validated.error.flatten().fieldErrors,
    });
  }

  try {
    return await authenticator.authenticate(AUTH_STRATEGY_NAME, request, {
      successRedirect: "/todos/incomplete",
      throwOnError: true,
    });
  } catch (error) {
    // If authentication is successful, an instance of Response is returned as the error and caught in the catch block.
    // In that case, returning the error will trigger the redirect to successRedirect.
    if (error instanceof Response) return error;
    if (error instanceof AuthorizationError) {
      return json({
        ...commonActionData,
        error: error.message,
      });
    }
    console.error(error);
    throw Error(ERROR_MESSAGES.unexpected);
  }
}
