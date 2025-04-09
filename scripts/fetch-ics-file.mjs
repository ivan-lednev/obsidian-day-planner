import fs from "fs";
import path from "path";
import "dotenv/config";
import fetch from "node-fetch";
import { Command } from "commander";

const program = new Command();

program
  .name("fetch-ics-file")
  .description("Download an ICS calendar and save it to a file")
  .requiredOption("--output <filename>", "Output file name")
  .parse(process.argv);

const { output: outputFile } = program.opts();

const calendarUrl = process.env.TEST_ICAL_LINK;

if (!calendarUrl) {
  console.error(`Expected to find TEST_ICAL_LINK in .env, but did not find it`);
  process.exit(1);
}

const outputPath = path.resolve("fixtures", outputFile);

const downloadIcs = async () => {
  try {
    const res = await fetch(calendarUrl);

    if (!res.ok) {
      console.error(`Failed to download ICS: ${res.status} ${res.statusText}`);
      process.exit(1);
    }

    const text = await res.text();

    fs.writeFileSync(outputPath, text);
    console.log(`ICS file saved to ${outputPath}`);
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
};

await downloadIcs();
