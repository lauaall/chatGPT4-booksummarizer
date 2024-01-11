const { ChatOpenAI } = require("@langchain/openai");
const readline = require("readline");
const fs = require("fs");

const chatModel = new ChatOpenAI({
  openAIApiKey: "...",
  modelName: "gpt-3.5-turbo-1106", //gpt-4-1106-preview*/
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let bookSegments = []; 
let totalWordCount = 0; 
let segmentationDone = false; 
// MAKE SURE TO NAME YOUR BOOK, BOOK.txt otherwise it wont be found, you need to convert it online from epub or pdf to .TXT
async function readBookContent() {
  return new Promise((resolve, reject) => {
    fs.readFile("book.txt", "utf8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}


function segmentText(text, chunkSize) {
  const words = text.split(/\s+/);
  const segments = [];
  let currentSegment = "";

  for (const word of words) {
    if (currentSegment.split(/\s+/).length < chunkSize) {
      currentSegment += word + " ";
    } else {
      segments.push(currentSegment.trim());
      currentSegment = word + " ";
    }
  }


  segments.push(currentSegment.trim());

  return segments;
}


function countTotalWords(text) {
  const words = text.split(/\s+/);
  return words.length;
}


async function getAnswerFromAI(question, contextSegments) {
  const input = contextSegments.join("\n") + "\n" + question;

  
  try {
    const answer = await chatModel.invoke(input);
    return answer;
  } catch (error) {
    console.error("Error communicating with AI:", error);
    return "Unable to retrieve answer from AI.";
  }
}


async function processUserQuestions() {
  while (true) {
    const userQuestion = await getUserQuestion();

    if (userQuestion.toLowerCase() === 'exit') {
      console.log('Exiting the program. Goodbye!');
      rl.close();
      break;
    }

    const answer = await getAnswerFromAI(userQuestion, bookSegments);
    console.log("AI Answer:", answer);
  }
}


function getUserQuestion() {
  return new Promise((resolve) => {
    rl.question("Ask a question (type 'exit' to stop): ", (question) => {
      resolve(question);
    });
  });
}


rl.on("close", () => {
  console.log("Readline interface closed.");
  process.exit(0);
});

async function main() {
  
  try {
    const bookContent = await readBookContent();
    bookSegments = segmentText(bookContent, 10000);
    totalWordCount = countTotalWords(bookContent);
    segmentationDone = true;
    requestPrice = totalWordCount / 750 * 0.0010;
    console.log("-------------------------------------------------------");
    console.log("\nBook segmentation completed.");
    console.log("Total words: " + totalWordCount);
    console.log(`Number of Segments: ${bookSegments.length}`);
    console.log("\nThe price for this book is approx. : " + requestPrice + "€");
    console.log("Calculated using price per 1000 tokens(€0.0010/1K tokens)");
    console.log("PRICE DOESNT CONTAIN USER QUESTION COSTS ONLY BOOK SENDING COST")
    console.log("\n-------------------------------------------------------");
  } catch (error) {
    console.error("Error reading book content:", error);
    return;
  }


  const aiResponses = [];
  for (let i = 0; i < bookSegments.length; i++) {
    try {
      
      console.log(`Sending segment ${i + 1} of ${bookSegments.length} to AI.`);
      const response = await chatModel.invoke(bookSegments[i]);
      console.log("-------------------------------");
      console.log(bookSegments[i]);
      console.log("-------------------------------");
      aiResponses.push(response);
    } catch (error) {
      console.error("Error communicating with AI:", error);
      return;
    }
  }

  console.log("AI processing completed.");

  
  if (segmentationDone) {
    await processUserQuestions();
  }
}


main();
