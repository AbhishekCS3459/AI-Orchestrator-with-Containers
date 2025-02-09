import { execSync } from "child_process";
import dotenv from "dotenv";
dotenv.config();

const sentimentImage = "sentiment_analysis_container";
const sentimentContainer = "sentiment-container";

// Data cleaning variables
const dataCleaningImage = "data_cleaning_container";
const dataCleaningContainer = "data-cleaning-container";

// Function to check if a Docker image exists
function imageExists(image) {
  try {
    const result = execSync(`docker images -q ${image}`).toString().trim();
    return result.length > 0;
  } catch (error) {
    console.error(`❌ Error checking image ${image}:`, error.message);
    return false;
  }
}

// Function to build a Docker image if it doesn't exist
function buildDockerImage(imageName, path) {
  if (!imageExists(imageName)) {
    console.log(`🚀 Building the Docker image for ${imageName}...`);
    execSync(`docker build -t ${imageName} ${path}`, { stdio: "inherit" });
    console.log(`✅ Build completed for ${imageName}.`);
  } else {
    console.log(`✅ Docker image ${imageName} already exists. Skipping build.`);
  }
}

// Function to run sentiment analysis
function runSentimentAnalysis(userText) {
  console.log("🚀 Running the sentiment analysis container...");

  try {
    const result = execSync(
      `docker run --rm -e TEXT="${userText}" ${sentimentImage}`,
      { encoding: "utf-8" }
    );
    console.log("📊 Sentiment Analysis Result:", result);

    const output = JSON.parse(result.trim());
    console.log(`Sentiment Score: ${output.sentiment_score}`);

    return {
      status: "done",
      sentiment_score: output.sentiment_score,
    };
  } catch (error) {
    console.error(
      "❌ Error running sentiment analysis container:",
      error.message
    );
  }
}

// Function to run data cleaning

function runDataCleaning(INPUT_FILENAME) {
  console.log("🚀 Running the data cleaning container...");

  try {
    const result = execSync(
      `docker run --rm \
        -e AWS_ACCESS_KEY_ID=${process.env.AWS_ACCESS_KEY_ID} \
        -e AWS_SECRET_ACCESS_KEY=${process.env.AWS_SECRET_ACCESS_KEY} \
        -e INPUT_FILENAME=${INPUT_FILENAME} \
        -v $(pwd)/data:/app/data \
        ${dataCleaningImage}`,
      { encoding: "utf-8" }
    );
    console.log("📂 Data Cleaning Output:", result);

    return {
      status: "done",
      message: "Data cleaning completed successfully.",
    };
  } catch (error) {
    console.error("❌ Error running data cleaning container:", error.message);
  }
}

// Execute sentiment analysis
export function executeSentimentalAnalysis(userText) {
  console.log("📢 Starting sentiment analysis...");
  buildDockerImage(sentimentImage, "./sentimental_analysis"); // Build if needed
  return runSentimentAnalysis(userText);
}

// Execute data cleaning
export function executeDataCleaning(INPUT_FILENAME) {
  console.log("📢 Starting data cleaning...");
  buildDockerImage(dataCleaningImage, "./datacleaning"); // Build if needed
  return runDataCleaning(INPUT_FILENAME);
}