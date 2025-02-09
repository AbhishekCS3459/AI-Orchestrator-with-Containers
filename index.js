import dotenv from "dotenv";
import Groq from "groq-sdk";
import readline from "readline";
import { executeDataCleaning, executeSentimentalAnalysis } from "./docker.js";

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Function to get user input from CLI
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
var userInputMain;

export async function main() {
  rl.question("Enter your message: ", async (userInput) => {
    userInputMain = userInput;
    const chatCompletion = await getGroqChatCompletion(userInput);

    if (chatCompletion.task) {
      console.log("Identified Task:", chatCompletion.task);
      if (chatCompletion.filename) {
        console.log("Filename detected:", chatCompletion.filename);
        executeTask(chatCompletion.task, chatCompletion.filename);
      } else {
        executeTask(chatCompletion.task);
      }
    } else {
      console.log("Error identifying task:", chatCompletion);
    }

    rl.close();
  });
}

export async function getGroqChatCompletion(message) {
  const response = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are a language model that strictly responds in JSON format.
        Identify the user's task and return a JSON object containing the "task" key.
        If the user mentions a filename (e.g., "data.csv", "report.xlsx"), extract it and include it in the response as the "filename" key.

        Example Inputs:
        - "Clean this dataset name uncleaned.csv"
        - "Perform data cleaning on raw_data.xlsx"
        - "Analyze this text: 'I love this product, it's amazing!'"

        Expected JSON Response:
        { "task": "data_cleaning", "filename": "uncleaned.csv" }
        { "task": "data_cleaning", "filename": "raw_data.xlsx" }
        { "task": "sentiment_analysis" }

        Important:
        - Only include "filename" if a file is mentioned.
        - Return JSON format only, without explanations.
        `,
      },
      {
        role: "user",
        content: `Analyze the task in this message: "${message}"`,
      },
    ],
    model: "llama-3.3-70b-versatile",
    response_format: { type: "json_object" },
    temperature: 0.0,
  });

  try {
    const content = response.choices[0].message.content;
    return JSON.parse(content); // Convert string to JSON
  } catch (error) {
    console.error("Error parsing response:", error);
    return { error: "Invalid JSON response" };
  }
}

function executeTask(task, filename = null) {
  switch (task) {
    case "sentiment_analysis":
      executeSentimentalAnalysis(userInputMain);
      break;
    case "data_cleaning":
      if (filename) {
        executeDataCleaning(filename);
      } else {
        console.log("❌ No filename detected for data cleaning.");
      }
      break;
    default:
      console.log("Unknown task:", task);
  }
}

main();
