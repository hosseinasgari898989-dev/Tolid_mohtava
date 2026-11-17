import fs from "node:fs";

const id = process.env.VIDEO_ID;

if (!id) {
  throw new Error("VIDEO_ID is missing.");
}

const path = "content_bank.json";
const bank = JSON.parse(
  fs.readFileSync(path, "utf8")
);

const video = bank.find(item => item.id === id);

if (!video) {
  throw new Error(`Video ${id} was not found.`);
}

video.status = "done";

fs.writeFileSync(
  path,
  JSON.stringify(bank, null, 2) + "\n",
  "utf8"
);

console.log(`Video ${id} marked as done.`);
