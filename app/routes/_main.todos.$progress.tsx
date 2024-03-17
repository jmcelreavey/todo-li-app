import {
  ActionIcon,
  Button,
  Modal,
  Stack,
  Table,
  TableTbody,
  Text,
} from "@mantine/core";
import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type SerializeFrom,
} from "@remix-run/node";
import {
  Form,
  NavLink,
  Outlet,
  useLoaderData,
  useNavigate,
  useNavigation,
  useParams,
  useSearchParams,
} from "@remix-run/react";
import invariant from "tiny-invariant";

import { BookmarkButton } from "../components/button";
import { CommonErrorBoundary } from "../components/error-boundary";
import { DeleteIcon, EditIcon } from "../components/icons";
import { CenterLoader } from "../components/loader";
import { TodoProgressBadge } from "../components/todos";
import { authenticator } from "../lib/auth.server";
import {
  SUCCESS_MESSAGE_KEY,
  commitSession,
  getSession,
} from "../lib/session.server";
import {
  changeTodoBookmark,
  deleteTodo,
  getTodosByProgress,
} from "../lib/todo.server";
import { type UnwrapArray } from "../type";
import { ERROR_MESSAGES } from "../utils";

export default function TodosByProgress() {
  const { todos } = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  if (navigation.state === "loading")
    return (
      <>
        <CenterLoader />
        <Outlet />
      </>
    );

  if (!todos.length)
    return (
      <>
        <Text my="sm" size="sm" ta="center">
          No matching TODOs found.
        </Text>
        <Outlet />
      </>
    );

  return (
    <>
      <Table>
        <TableTbody>
          {todos.map((todo) => (
            <TableRow key={todo.id} todo={todo} />
          ))}
        </TableTbody>
      </Table>

      <DeleteConfirmModal />
      <Outlet />
    </>
  );
}

interface TableRowProps {
  todo: UnwrapArray<SerializeFrom<typeof loader>["todos"]>;
}

function TableRow({ todo }: TableRowProps) {
  return (
    <Table.Tr>
      <Table.Td w="2rem" align="center">
        <BookmarkButton todoId={todo.id} todoBookmarked={todo.bookmark} />
      </Table.Td>
      <Table.Td>{todo.title}</Table.Td>
      <Table.Td>
        <TodoProgressBadge
          progress={todo.progress as "incomplete" | "inprogress" | "complete"}
        />
      </Table.Td>
      <Table.Td w="3rem">
        <ActionIcon
          renderRoot={(props) => (
            <NavLink to={`${todo.id}/edit`} replace {...props} />
          )}
          variant="light"
        >
          <EditIcon />
        </ActionIcon>
      </Table.Td>
      <Table.Td w="3rem">
        {/* Use query parameters to control modal open/close */}
        <Form replace>
          <ActionIcon
            type="submit"
            name="deletedId"
            color="red"
            variant="light"
            value={todo.id}
          >
            <DeleteIcon />
          </ActionIcon>
          <input type="hidden" name="deletedTitle" defaultValue={todo.title} />
        </Form>
      </Table.Td>
    </Table.Tr>
  );
}

function DeleteConfirmModal() {
  const { progress } = useParams();
  invariant(progress, ERROR_MESSAGES.invalidParam);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const submitting = useNavigation().state === "submitting";

  return (
    <Modal
      opened={!!searchParams.get("deletedId")}
      onClose={() => navigate(`/todos/${progress}`, { replace: true })}
      title="Delete Confirmation"
    >
      <Stack
        renderRoot={(props) => <Form method="post" replace {...props} />}
        gap="sm"
      >
        <Text>
          Are you sure you want to delete {searchParams.get("deletedTitle")}?
        </Text>
        <Button
          type="submit"
          name="intent"
          value="delete"
          ml="auto"
          color="red"
          disabled={submitting}
        >
          Delete
        </Button>
      </Stack>
    </Modal>
  );
}

export function ErrorBoundary() {
  return <CommonErrorBoundary />;
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/auth/sign-in",
  });

  const { progress } = params;
  invariant(progress, ERROR_MESSAGES.invalidParam);

  return json({
    todos: await getTodosByProgress({ userId: user.id, progress }),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  switch (formData.get("intent")) {
    case "delete": {
      const url = new URL(request.url);
      const deletedId = Number(url.searchParams.get("deletedId"));

      const deletedTodo = await deleteTodo({ id: deletedId });

      const session = await getSession(request.headers.get("Cookie"));
      session.flash(
        SUCCESS_MESSAGE_KEY,
        `${deletedTodo.title} has been deleted.`
      );

      return redirect(url.pathname, {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    }
    case "bookmark": {
      const todoId = Number(formData.get("todoId"));
      const prevBookmarked = formData.get("bookmarked") === "true";

      return await changeTodoBookmark({
        id: todoId,
        bookmark: !prevBookmarked,
      });
    }
    default: {
      throw Error(ERROR_MESSAGES.unexpected);
    }
  }
}
