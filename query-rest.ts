import fs from "fs";

async function run() {
  const firebaseAppletConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  const key = firebaseAppletConfig.apiKey;
  const dbPath = `projects/gen-lang-client-0387723123/databases/ai-studio-1d17aef0-f9e2-48aa-bbba-ff95554e5700`;
  
  console.log("Fetching categories from Firestore via REST...");
  try {
    const urlCat = `https://firestore.googleapis.com/v1/${dbPath}/documents/categories?key=${key}`;
    const res = await fetch(urlCat);
    const data = await res.json();
    console.log("Categories Result:", JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error("Error categories:", err.message);
  }

  console.log("\nFetching some products from Firestore via REST...");
  try {
    const urlProd = `https://firestore.googleapis.com/v1/${dbPath}/documents/products?pageSize=10&key=${key}`;
    const res = await fetch(urlProd);
    const data = await res.json();
    console.log("Products Result:");
    if (data.documents) {
      data.documents.forEach((doc: any) => {
        const fields = doc.fields;
        const name = fields?.name?.stringValue;
        const categoryId = fields?.categoryId?.stringValue;
        const gender = fields?.gender?.stringValue;
        console.log(`Product: "${name}" | categoryId: "${categoryId}" | gender: "${gender}" | Fields keys:`, Object.keys(fields || {}));
      });
    } else {
      console.log("No products found:", data);
    }
  } catch (err: any) {
    console.error("Error products:", err.message);
  }
}

run();







