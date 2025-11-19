import { getRequestHeaders } from '../utils/api';

export async function fetchChatCompletionStatus(settings: {
  chat_completion_source: string;
  reverse_proxy?: string;
  proxy_password?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): Promise<any> {
  // TODO: Proper type
  const response = await fetch('/api/backends/chat-completions/status', {
    method: 'POST',
    headers: getRequestHeaders(),
    body: JSON.stringify(settings),
    cache: 'no-cache',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to check status: ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}
