import { HumeClient } from "hume";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const client = new HumeClient({
    apiKey: process.env.HUME_API_KEY,
    secretKey: process.env.HUME_SECRET_KEY,
  });

  try {
    const job = await client.expressionMeasurement.batch.startInferenceJob({
      urls: ["https://huggingface.co/datasets/huggingfacejs/tasks/resolve/main/audio-classification/audio.wav"],
      models: {
        language: {},
        prosody: {}
      }
    });
    console.log("Job started:", job.jobId);
    
    // Check status
    const status = await client.expressionMeasurement.batch.getJobDetails(job.jobId);
    console.log("Status:", status.state.status);
    
  } catch (e) {
    console.error(e);
  }
}

main();
