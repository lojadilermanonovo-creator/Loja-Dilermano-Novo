import fs from "fs";

async function run() {
  const firebaseAppletConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  const key = firebaseAppletConfig.apiKey;
  const url = `https://firestore.googleapis.com/v1/projects/gen-lang-client-0387723123/databases/ai-studio-1d17aef0-f9e2-48aa-bbba-ff95554e5700/documents:runQuery?key=${key}`;
  const body = {
    structuredQuery: {
      from: [{ collectionId: "orders" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "orderNumber" },
          op: "EQUAL",
          value: { stringValue: "DI-20260616-8781" }
        }
      }
    }
  };

  console.log("Sending REST query with API key to Firestore...");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    
    if (!res.ok) {
      console.error("HTTP error:", res.status, await res.text());
      return;
    }

    const data = await res.json();
    console.log("Result:", JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error("Error connecting:", err.message);
  }
}

run();
