import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

const API_KEY = process.env.OVH_AI_API_KEY;
if (!API_KEY) {
  console.error('Please set the OVH_AI_API_KEY environment variable.');
  process.exit(1);
}

// Example base URL for Mistral Large in EU region
const BASE_URL = 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function chat(messages: ChatMessage[]): Promise<string> {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-oss-120b',
      messages: messages
    })
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function main() {
  const messages: ChatMessage[] = [];

  console.log('AI Chat with OVH. Type "exit" to quit.');

  while (true) {
    const input = await new Promise<string>((resolve) => {
      rl.question('You: ', resolve);
    });

    if (input.toLowerCase() === 'exit') break;

    messages.push({ role: 'user', content: input });

    try {
      const reply = await chat(messages);
      console.log('AI: ' + reply);
      messages.push({ role: 'assistant', content: reply });
    } catch (error) {
      console.error('Error:', error);
    }
  }

  rl.close();
}

main().catch(console.error);