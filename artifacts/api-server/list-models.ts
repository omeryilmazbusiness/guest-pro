import "dotenv/config";

async function run() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  console.log("Using API Key:", apiKey ? apiKey.substring(0, 10) + "..." : "NONE");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
