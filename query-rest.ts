import fs from "fs";

async function run() {
  const firebaseAppletConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  const key = firebaseAppletConfig.apiKey;
  const dbPath = `projects/gen-lang-client-0387723123/databases/ai-studio-1d17aef0-f9e2-48aa-bbba-ff95554e5700`;
  const url = `https://firestore.googleapis.com/v1/${dbPath}/documents/coupons/DEREK10?key=${key}`;

  console.log("Fetching coupon DEREK10 from Firestore via REST...");
  try {
    const res = await fetch(url, {
      method: "GET"
    });
    
    console.log("HTTP status:", res.status);
    const data = await res.json();
    console.log("Result:", JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error("Error connecting:", err.message);
  }
}

run();






