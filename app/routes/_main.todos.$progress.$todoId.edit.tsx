import {
  Button,
  Fieldset,
  Modal,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
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
import { UpdateTodoSchema, getTodo, updateTodo } from "../lib/todo.server";
import { ERROR_MESSAGES } from "../utils";

export default function TodosEdit() {
  const { progress } = useParams();
  invariant(progress, ERROR_MESSAGES.invalidParam);

  const { todo } = useLoaderData<typeof loader>();

  const actionData = useActionData<typeof action>();
  const validationErrors = actionData?.validationErrors;

  const navigate = useNavigate();
  const navigation = useNavigation();

  return (
    <Modal
      opened
      onClose={() => navigate(`/todos/${progress}`, { replace: true })}
      title="Edit"
    >
      <Form method="post" replace>
        <Stack
          renderRoot={(props) => (
            <Fieldset
              disabled={navigation.state === "submitting"}
              variant="unstyled"
              {...props}
            />
          )}
          gap="sm"
        >
          <TextInput
            name="title"
            label="Title"
            withAsterisk
            placeholder="Enter a title within 20 characters."
            defaultValue={todo.title}
            error={validationErrors?.title && validationErrors.title[0]}
          />
          <Select
            name="progress"
            label="Progress"
            withAsterisk
            placeholder="Select a progress."
            data={[
              { value: "incomplete", label: "Incomplete" },
              { value: "inprogress", label: "In Progress" },
              { value: "complete", label: "Complete" },
            ]}
            defaultValue={todo.progress}
          />
          <Button type="submit" ml="auto">
            Edit
          </Button>
        </Stack>
      </Form>
    </Modal>
  );
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    failureRedirect: "/auth/sign-in",
  });

  const { todoId } = params;
  invariant(todoId, ERROR_MESSAGES.invalidParam);

  return json({
    todo: await getTodo({ id: Number(todoId) }),
  });
}

export async function action({ params, request }: ActionFunctionArgs) {
  const { todoId } = params;
  invariant(todoId, ERROR_MESSAGES.invalidParam);

  const formDataObj = Object.fromEntries(await request.formData());
  const validated = UpdateTodoSchema.safeParse(formDataObj);

  if (!validated.success) {
    return json({
      validationErrors: validated.error.flatten().fieldErrors,
    });
  }

  const updatedTodo = await updateTodo({
    id: Number(todoId),
    ...validated.data,
  });

  const session = await getSession(request.headers.get("Cookie"));
  session.flash(
    SUCCESS_MESSAGE_KEY,
    `Successfully edited ${updatedTodo.title}.`
  );

  return redirect(`/todos/${updatedTodo.progress}`, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}
