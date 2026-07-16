/* eslint-disable @typescript-eslint/no-explicit-any */

// import { base64image } from "../constants";

// Config
const GH_TOKEN = process.env.GH_TOKEN;
const USERNAME = "chandanSahoo-cs";

const headers = {
  Authorization: `Bearer ${GH_TOKEN}`,
  "User-Agent": "chandanSahoo-cs-card",
};

interface UserProfile {
  user: {
    age: string | null;
    stack: string[];
  };
  github: {
    blog: string;
    html_url: string;
    userAvatar: string;
    stars: number;
    lastCommitDate: string;
    languages: string[];
    followers: number;
    public_repos: number;
  };
  competitivePlatform: {
    codeforces: {
      codeforcesRating: number | null;
      codeforcesRank: string | null;
    };
    codechef: {
      codechefRating: number | null;
      codechefRank: string | null;
    };
    leetcode: {
      leetcodeRating: number | null;
    };
  };
}

// Utility Functions

const getCompressedBase64Avatar = async (
  avatar_url: string
): Promise<string> => {
  try {
    const response = await fetch(avatar_url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error("Error :: ", error);
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGPgFRQHAABkADaBug1BAAAAAElFTkSuQmCC";
  }
};

const getCurrentAge = (): string => {
  const birthDate = new Date("2005-11-03");
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();
  if (days < 0) {
    months--;
    days += 30;
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  const age = `${years}y ${months}m ${days}d`;

  return age;
};

// Escapes text that gets interpolated into the SVG so stray "&", "<", ">"
// in bios/usernames/etc. can't break the markup.
const escapeXml = (value: string | number): string =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Joins a list with a separator, truncating with a "+N more" suffix so a
// long language/stack list can't overflow the card width.
const joinTruncated = (
  items: string[],
  max: number,
  sep = " • "
): string => {
  if (items.length <= max) return items.map(escapeXml).join(sep);
  const shown = items.slice(0, max).map(escapeXml).join(sep);
  return `${shown} +${items.length - max} more`;
};

// Data fetch
const fetchedData = async (): Promise<UserProfile | null> => {
  try {
    const [userRes, repoRes, codeforces, codechef, leetcode] =
      await Promise.all([
        fetch(`https://api.github.com/users/${USERNAME}`, {
          headers,
        }),
        fetch(
          `https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=pushed&direction=des`,
          {
            headers,
          }
        ),
        fetch("https://competeapi.vercel.app/user/codeforces/realmchan/"),
        fetch("https://competeapi.vercel.app/user/codechef/realm/"),
        fetch("https://competeapi.vercel.app/user/leetcode/realmchan/"),
      ]);

    const [user, repos, codeforcesDetails, codechefDetails, leetcodeDetails] =
      await Promise.all([
        userRes.json(),
        repoRes.json(),
        codeforces.json(),
        codechef.json(),
        leetcode.json(),
      ]);

    const userAvatar = await getCompressedBase64Avatar(user.avatar_url);

    const stars = repos.reduce(
      (sum: number, r: any) => sum + (r.stargazers_count || 0),
      0
    );

    const lastCommitDate = repos[0]?.updated_at
      ? new Date(repos[0].updated_at).toLocaleString()
      : "N/A";

    const languages = repos
      .filter((r: any) => r.language)
      .reduce((acc: any, r: any) => {
        acc[r.language] = (acc[r.language] || 0) + 1;
        return acc;
      }, {});

    // May be in future
    const languagesArray = Object.entries(languages)
      .sort(([, a]: any, [, b]: any) => b - a)
      .map(([lang, num]) => lang + `(${num})`);

    const age = getCurrentAge();

    // Rank and Rating
    const codeforcesRating = await codeforcesDetails[0].rating;
    const codeforcesRank = await codeforcesDetails[0].rank.toUpperCase();

    const codechefRating = await codechefDetails.rating_number;
    const codechefRank =
      (await codechefDetails.rating.toUpperCase()[0]) + " STAR";

    const leetcodeRating = Math.floor(
      leetcodeDetails.data.userContestRanking.rating
    );

    const stack = [
      "Typescript",
      "Javascript",
      "C++",
      "Go",
      "Reactjs",
      "Nextjs",
      "Docker",
      "Git",
      "PostgresSQL",
      "MongoDB",
    ];

    const res: UserProfile = {
      user: {
        age,
        stack,
      },
      github: {
        blog: user.blog,
        html_url: user.html_url,
        userAvatar,
        stars,
        lastCommitDate,
        languages: languagesArray,
        public_repos: user.public_repos,
        followers: user.followers,
      },
      competitivePlatform: {
        codeforces: {
          codeforcesRating,
          codeforcesRank,
        },
        codechef: {
          codechefRating,
          codechefRank,
        },
        leetcode: {
          leetcodeRating,
        },
      },
    };

    return res;
  } catch (error) {
    console.log("Error :: ", error);
    return null;
  }
};

// ---- SVG layout helpers -----------------------------------------------

const CARD_WIDTH = 1200;

// Renders a "$ <command>" terminal prompt line at the given y position.
const promptLine = (y: number, cmd: string): string => `
    <text x="24" y="${y}" class="prompt">$ <tspan class="command">${escapeXml(
  cmd
)}</tspan></text>`;

// Renders a rounded panel background.
const panel = (y: number, height: number): string => `
    <rect x="24" y="${y}" width="${
  CARD_WIDTH - 48
}" height="${height}" rx="8" class="panel"/>`;

// Renders a "label ... value" row inside a panel.
const statRow = (
  x: number,
  y: number,
  label: string,
  value: string | number,
  valueClass = "text"
): string => `
    <text x="${x}" y="${y}" class="label">${escapeXml(label)}</text>
    <text x="${x + 130}" y="${y}" class="${valueClass}">${escapeXml(
  value
)}</text>`;

const profileSVG = async () => {
  try {
    const data = await fetchedData();
    if (!data) {
      throw new Error("Not able to fetch user detail");
    }

    const userAvatar = data.github.userAvatar;
    const stars = data.github.stars;
    const languages = data.github.languages;
    const age = data.user.age;
    const lastCommitDate = data.github.lastCommitDate;
    const stack = data.user.stack;

    // Rank and Rating
    const codeforcesRating =
      data.competitivePlatform.codeforces.codeforcesRating ?? "N/A";
    const codeforcesRank =
      data.competitivePlatform.codeforces.codeforcesRank ?? "N/A";

    const codechefRating =
      data.competitivePlatform.codechef.codechefRating ?? "N/A";
    const codechefRank =
      data.competitivePlatform.codechef.codechefRank ?? "N/A";

    const leetcodeRating =
      data.competitivePlatform.leetcode.leetcodeRating ?? "N/A";

    const svg = `
  <svg width="${CARD_WIDTH}" height="880" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="headerGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#161b22"/>
        <stop offset="100%" stop-color="#21262d"/>
      </linearGradient>
      <style>
        .terminal-bg { fill: #0d1117; }
        .header-bg { fill: url(#headerGrad); }
        .dot-red { fill: #ff5f56; }
        .dot-yellow { fill: #ffbd2e; }
        .dot-green { fill: #27c93f; }
        .panel { fill: #161b22; stroke: #30363d; stroke-width: 1; }
        .prompt { fill: #a855f7; font-family: 'Fira Code', monospace; font-size: 13px; }
        .command { fill: #22d3ee; font-family: 'Fira Code', monospace; font-size: 13px; }
        .text { fill: #c9d1d9; font-family: 'Fira Code', monospace; font-size: 13px; }
        .label { fill: #7d8590; font-family: 'Fira Code', monospace; font-size: 13px; }
        .link { fill: #58a6ff; font-family: 'Fira Code', monospace; font-size: 13px; }
        .accent { fill: #f97316; font-family: 'Fira Code', monospace; font-size: 13px; }
        .success { fill: #3fb950; font-family: 'Fira Code', monospace; font-size: 13px; }
        .info { fill: #58a6ff; font-family: 'Fira Code', monospace; font-size: 13px; }
        .titleText { fill: #e6edf3; font-family: 'Fira Code', monospace; font-size: 20px; font-weight: bold; }
        .subTitle { fill: #7d8590; font-family: 'Fira Code', monospace; font-size: 13px; }
      </style>
    </defs>

    <!-- Window chrome -->
    <rect width="100%" height="100%" rx="10" class="terminal-bg"/>
    <rect width="100%" height="34" rx="10" class="header-bg"/>
    <rect y="16" width="100%" height="18" class="header-bg"/>
    <circle cx="20" cy="17" r="6" class="dot-red"/>
    <circle cx="40" cy="17" r="6" class="dot-yellow"/>
    <circle cx="60" cy="17" r="6" class="dot-green"/>
    <text x="600" y="22" class="label" text-anchor="middle">${escapeXml(
      USERNAME
    )}@github: ~</text>

    ${promptLine(56, `git connect ${data.github.blog || data.github.html_url}`)}
    <text x="24" y="74" class="success">✓ connection established</text>

    <!-- Profile panel -->
    ${panel(92, 248)}
    <circle cx="112" cy="196" r="64" fill="#21262d" stroke="#58a6ff" stroke-width="2"/>
    <image x="52" y="136" width="120" height="120" href="${userAvatar}" clip-path="circle(60px at 60px 60px)"/>

    <text x="220" y="130" class="titleText">${escapeXml(USERNAME)}</text>
    <text x="220" y="150" class="subTitle">@${escapeXml(USERNAME)}</text>

    ${statRow(220, 184, "OS", "Arch Linux")}
    ${statRow(220, 208, "Host", "Delhi, India")}
    ${statRow(220, 232, "Uptime", age ?? "N/A")}
    ${statRow(220, 256, "Public Repos", `${data.github.public_repos} repos`)}
    ${statRow(220, 280, "Stars", `${stars} stars`)}

    ${statRow(650, 184, "Followers", `${data.github.followers} followers`)}
    ${statRow(650, 208, "Last Commit", lastCommitDate)}
    ${statRow(650, 232, "Languages", joinTruncated(languages, 4))}

    <line x1="220" y1="300" x2="1140" y2="300" stroke="#30363d" stroke-width="1"/>
    <rect x="220" y="312" width="18" height="18" rx="3" fill="#ff5f56"/>
    <rect x="248" y="312" width="18" height="18" rx="3" fill="#ffbd2e"/>
    <rect x="276" y="312" width="18" height="18" rx="3" fill="#27c93f"/>
    <rect x="304" y="312" width="18" height="18" rx="3" fill="#58a6ff"/>
    <rect x="332" y="312" width="18" height="18" rx="3" fill="#a855f7"/>
    <rect x="360" y="312" width="18" height="18" rx="3" fill="#f97316"/>
    <rect x="388" y="312" width="18" height="18" rx="3" fill="#3fb950"/>
    <rect x="416" y="312" width="18" height="18" rx="3" fill="#22d3ee"/>

    <!-- Stack panel -->
    ${promptLine(372, "git log --stack --oneline")}
    ${panel(386, 50)}
    <text x="40" y="416" class="text">${joinTruncated(stack, stack.length)}</text>

    <!-- Competitive profiles panel -->
    ${promptLine(464, "git log --profiles")}
    ${panel(478, 112)}
    <text x="40" y="510" class="label">Codeforces</text>
    <a href="https://codeforces.com/profile/Realmchan" target="_blank" rel="noopener noreferrer">
      <text x="180" y="510" class="text">Realmchan</text>
      <text x="360" y="510" class="text">${escapeXml(codeforcesRating)}</text>
      <text x="440" y="510" class="accent">${escapeXml(codeforcesRank)}</text>
    </a>

    <text x="40" y="538" class="label">CodeChef</text>
    <a href="https://www.codechef.com/users/realm" target="_blank" rel="noopener noreferrer">
      <text x="180" y="538" class="text">realm</text>
      <text x="360" y="538" class="text">${escapeXml(codechefRating)}</text>
      <text x="440" y="538" class="accent">${escapeXml(codechefRank)}</text>
    </a>

    <text x="40" y="566" class="label">LeetCode</text>
    <a href="https://leetcode.com/realmchan" target="_blank" rel="noopener noreferrer">
      <text x="180" y="566" class="text">realmchan</text>
      <text x="360" y="566" class="text">${escapeXml(leetcodeRating)}</text>
    </a>

    <!-- Connect panel -->
    ${promptLine(614, "git ping -c1 chandansahoo.dev")}
    ${panel(628, 140)}
    <text x="40" y="660" class="label">Email</text>
    <a href="mailto:chandansahoo02468@gmail.com" target="_blank" rel="noopener noreferrer">
      <text x="180" y="660" class="link">chandansahoo02468@gmail.com</text>
    </a>
    <text x="40" y="688" class="label">LinkedIn</text>
    <a href="https://linkedin.com/in/chandansahoo-cs" target="_blank" rel="noopener noreferrer">
      <text x="180" y="688" class="link">chandansahoo-cs</text>
    </a>
    <text x="40" y="716" class="label">GitHub</text>
    <a href="https://github.com/chandanSahoo-cs" target="_blank" rel="noopener noreferrer">
      <text x="180" y="716" class="link">chandanSahoo-cs</text>
    </a>
    <text x="40" y="744" class="label">Discord</text>
    <a href="https://discord.com/users/chandansahoo" target="_blank" rel="noopener noreferrer">
      <text x="180" y="744" class="link">chandansahoo</text>
    </a>

    ${promptLine(800, "gh-shell switch --keep-history")}
    <text x="24" y="822" class="text">Migrating history... done</text>
    <text x="24" y="842" class="text">Applying theme: github-readme ✓</text>

    <rect x="0" y="0" width="${CARD_WIDTH}" height="880" rx="10" fill="none" stroke="#30363d" stroke-width="2"/>
  </svg>
    `;
    return svg;
  } catch (error) {
    console.error("Error :: ", error);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="120" style="background:#0d1117; font-family: monospace;">
    <style>
        .terminal-bg { fill: #0d1117; }
        .prompt { fill: #a855f7; font-family: 'Fira Code', monospace; font-size: 14px; }
        .text { fill: #ff5f56; font-family: 'Fira Code', monospace; font-size: 13px; }
    </style>
    <rect width="100%" height="100%" fill="#0d1117" />
    <text x="20" y="40" class="prompt">$ git connect https://github.com/chandanSahoo-cs</text>
    <text x="20" y="70" class="text">✗ ${escapeXml(String(error))}</text>
    <text x="20" y="90" class="text" fill="#c9d1d9">Check out my projects until then :)</text>
    </svg>
    `;
    return svg;
  }
};

export { type UserProfile, fetchedData, profileSVG };

/* eslint-enable @typescript-eslint/no-explicit-any */