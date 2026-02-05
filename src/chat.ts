import { createInterface } from 'readline';
import fetch from 'node-fetch'; // Ensure this dependency is installed

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

async function meteo(location: string, date: string): Promise<string> {
  // Use wttr.in, a free weather API that does not require an API key
  // Note: wttr.in only supports current and short-term forecast, not arbitrary future dates
  const url = `https://wttr.in/${encodeURIComponent(location)}?format=j1`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather API request failed: ${response.status} ${response.statusText}`);
  }
  const data: any = await response.json();

  // If date is 'demain' or tomorrow, use the second forecast day
  let forecast;
  if (date === 'demain' || date === new Date(Date.now() + 86400000).toISOString().split('T')[0]) {
    forecast = data.weather[1];
  } else {
    forecast = data.weather[0];
  }
  const condition = forecast.hourly[4].weatherDesc[0].value;
  const temp = forecast.avgtempC;

  return `La météo à ${location} le ${date} prévoit ${condition} avec une température moyenne de ${temp}°C.`;
}

// System prompt describing the 'meteo' tool
const SYSTEM_PROMPT = `Vous avez accès à un outil appelé 'meteo' qui fournit la météo pour une localisation et une date données. Pour l'utiliser, répondez par :
<tool> meteo { "localisation": "Paris", "date": "2026-02-06" } </tool>
Si l'utilisateur pose une question sur la météo ou le temps, répondez uniquement par cet appel d'outil avec les bons paramètres. Après l'appel, formatez la réponse météo pour l'utilisateur.`;

async function chat(messages: ChatMessage[]): Promise<string> {
  // Always prepend the system prompt
  const allMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages
  ];

  // Log the payload sent to the LLM
  console.log('--- LLM REQUEST PAYLOAD ---');
  console.log(JSON.stringify({
    model: 'gpt-oss-120b',
    messages: allMessages
  }, null, 2));

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-oss-120b',
      messages: allMessages
    })
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data: any = await response.json();
  console.log('--- LLM RESPONSE PAYLOAD ---');
  console.log(JSON.stringify(data, null, 2));
  const llmReply = data.choices[0].message.content;

  // Detect tool call in LLM reply
  const toolMatch = llmReply.match(/<tool>\s*meteo\s*({[^}]+})\s*<\/tool>/i);
  if (toolMatch) {
    try {
      const params = JSON.parse(toolMatch[1]);
      const weather = await meteo(params.localisation, params.date);
      // Ask LLM to format the weather result for the user
      const formatMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
        { role: 'user', content: `Voici la réponse brute de l'outil météo : ${weather}. Reformule et présente la réponse à l'utilisateur.` }
      ];
      // Log the payload sent for formatting
      console.log('--- LLM FORMAT REQUEST PAYLOAD ---');
      console.log(JSON.stringify({
        model: 'gpt-oss-120b',
        messages: formatMessages
      }, null, 2));
      const formatResponse = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-oss-120b',
          messages: formatMessages
        })
      });
      if (!formatResponse.ok) {
        throw new Error(`API request failed: ${formatResponse.status} ${formatResponse.statusText}`);
      }
      const formatData: any = await formatResponse.json();
      console.log('--- LLM FORMAT RESPONSE PAYLOAD ---');
      console.log(JSON.stringify(formatData, null, 2));
      return formatData.choices[0].message.content;
    } catch (error) {
      return `Erreur lors de l'appel à l'outil météo : ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
    }
  }

  return llmReply;
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