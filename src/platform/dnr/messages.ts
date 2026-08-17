import {
  onRuntimeMessage,
  sendRuntimeMessage,
} from "@/src/platform/browser/api";

const REINITIALIZE_DNR_MESSAGE = "header-ext:reinitialize-dnr";

interface DnrReinitializeResponse {
  error?: string;
}

function isReinitializeMessage(
  message: unknown,
): message is { type: typeof REINITIALIZE_DNR_MESSAGE } {
  return Boolean(
    message &&
    typeof message === "object" &&
    "type" in message &&
    message.type === REINITIALIZE_DNR_MESSAGE,
  );
}

export async function requestDnrReinitialize(): Promise<void> {
  const response = (await sendRuntimeMessage({
    type: REINITIALIZE_DNR_MESSAGE,
  })) as DnrReinitializeResponse | undefined;
  if (response?.error) throw new Error(response.error);
}

export function onDnrReinitializeRequest(
  handler: () => Promise<void>,
): () => void {
  return onRuntimeMessage((message) => {
    if (!isReinitializeMessage(message)) return undefined;
    return handler()
      .then(() => ({}))
      .catch((error: unknown) => ({
        error: error instanceof Error ? error.message : String(error),
      }));
  });
}
