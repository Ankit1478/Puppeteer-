import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// Replicating __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a directory to store downloaded audio files
const directory = path.join(__dirname, 'audioFiles');

// Ensure the directory exists
if (!fs.existsSync(directory)) {
  fs.mkdirSync(directory);
}

const downloadAudio = (url, filePath) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath); // Delete the file on error
      reject(err);
    });
  });
};

const getAudio = async () => {
  // Start a Puppeteer session
  const browser = await puppeteer.launch({
    headless: false, // Optional: Set to false to see the browser in action
    defaultViewport: null, // Optional: No default viewport so the page loads fully
  });

  // Open a new page
  const page = await browser.newPage();
  await page.goto("https://mixkit.co/free-sound-effects/animals/", {
    waitUntil: "domcontentloaded",
  });

  // Use `$$eval` to select all audio elements and map over them
  const audioUrls = await page.$$eval('audio', audios => audios.map(audio => audio.src));
 
  const audioFilesName = await page.$$eval('.item-grid-card__title', title=>title.map(titles => titles.textContent.trim()));
  console.log(audioFilesName);

  // Loop through the URLs and download each audio file
  for (let i = 0; i < audioUrls.length; i++) {
    const filePath = path.join(directory, `${audioFilesName[i]}.mp3`);
    
    try {
      await downloadAudio(audioUrls[i], filePath);
    } catch (error) {
      console.error(`Error downloading ${audioUrls[i]}: ${error.message}`);
    }
  }

  // Close the browser
  await browser.close();
};

// Run the script
getAudio();
