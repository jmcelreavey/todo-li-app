import { Button, Fieldset, Modal, Stack, TextInput } from "@mantine/core";
import {
  ActionFunctionArgs,
  json,
  redirect,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useNavigate,
  useNavigation,
  useParams,
} from "@remix-run/react";
import invariant from "tiny-invariant";

import { authenticator } from "../lib/auth.server";
import {
  SUCCESS_MESSAGE_KEY,
  commitSession,
  getSession,
} from "../lib/session.server";
import { CreateTodoSchema, createTodo } from "../lib/todo.server";
import { ERROR_MESSAGES } from "../utils";

export default function TodosNew() {
  const { progress } = useParams();
  invariant(progress, ERROR_MESSAGES.invalidParam);

  const actionData = useActionData<typeof action>();
  const validationErrors = actionData?.validationErrors;

  const navigate = useNavigate();
  const submitting = useNavigation().state === "submitting";

  return (
    <Modal
      opened
      onClose={() => navigate(`/todos/${progress}`, { replace: true })}
      title="Create"
    >
      <Form method="post" replace>
        <Stack
          renderRoot={(props) => (
            <Fieldset disabled={submitting} variant="unstyled" {...props} />
          )}
          gap="sm"
        >
          <TextInput
            name="title"
            label="Title"
            withAsterisk
            placeholder="Enter a title within 20 characters."
            error={validationErrors?.title && validationErrors.title[0]}
          />
          <Button type="submit" ml="auto">
            Create
          </Button>
        </Stack>
      </Form>
    </Modal>
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  return await authenticator.isAuthenticated(request, {
    failureRedirect: "/auth/sign-in",
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formDataObj = Object.fromEntries(await request.formData());
  const validated = CreateTodoSchema.safeParse(formDataObj);

  if (!validated.success) {
    return json({
      validationErrors: validated.error.flatten().fieldErrors,
    });
  }

  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/auth/sign-in",
  });

  await createTodo({ userId: user.id, title: validated.data.title });

  const newTodo = await createTodo({
    userId: user.id,
    title: validated.data.title,
  });

  const session = await getSession(request.headers.get("Cookie"));
  session.flash(SUCCESS_MESSAGE_KEY, `Created ${newTodo.title}.`);

  return redirect("/todos/incomplete", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}
