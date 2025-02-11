import { Table, TableTbody, Text } from "@mantine/core";
import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, useNavigation } from "@remix-run/react";

import { BookmarkButton } from "../components/button";
import { CommonErrorBoundary } from "../components/error-boundary";
import { CenterLoader } from "../components/loader";
import { TodoProgressBadge } from "../components/todos";
import { authenticator } from "../lib/auth.server";
import { changeTodoBookmark, getTodosByBookmarked } from "../lib/todo.server";

export default function BookmarksIndex() {
  const { bookmarkedTodos } = useLoaderData<typeof loader>();

  const navigation = useNavigation();

  if (navigation.state === "loading") return <CenterLoader />;
  if (!bookmarkedTodos.length)
    return (
      <Text my="sm" size="sm" ta="center">
        No bookmarked TODOs found.
      </Text>
    );

  return (
    <Table>
      <TableTbody>
        {bookmarkedTodos.map((todo) => (
          <Table.Tr key={todo.id}>
            <Table.Td width="2rem" align="center">
              <BookmarkButton todoId={todo.id} todoBookmarked={todo.bookmark} />
            </Table.Td>
            <Table.Td>{todo.title}</Table.Td>
            <Table.Td>
              <TodoProgressBadge
                progress={
                  todo.progress as "incomplete" | "inprogress" | "complete"
                }
              />
            </Table.Td>
          </Table.Tr>
        ))}
      </TableTbody>
    </Table>
  );
}

export function ErrorBoundary() {
  return <CommonErrorBoundary />;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/auth/sign-in",
  });

  return json({
    bookmarkedTodos: await getTodosByBookmarked({ userId: user.id }),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const todoId = Number(formData.get("todoId"));
  const prevBookmarked = formData.get("bookmarked") === "true";

  return await changeTodoBookmark({
    id: todoId,
    bookmark: !prevBookmarked,
  });
}
