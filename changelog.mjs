import { simpleGit } from "simple-git";

const git = simpleGit();

const publicPrefixes = ["feat", "fix"];
const publicMessagePattern = new RegExp(`(${publicPrefixes.join("|")})\\(public\\): `);

async function formatChangelog() {
  const tags = await git.tags();
  const logs = await git.log({ from: tags.latest, to: "HEAD" });

  const publicLogs = logs.all.reduce((result, current) => {
    if (current.message.match(publicMessagePattern)) {
      if (current.message.startsWith("feat")) {
        result.feat.push(current);
      } else if (current.message.startsWith("fix")) {
        result.fix.push(current);
      }
    }

    return result;
  }, { feat: [], fix: [] });

  return publicLogs;
}

formatChangelog().then(console.log, console.log);
