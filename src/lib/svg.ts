/* eslint-disable @typescript-eslint/no-explicit-any */
import sharp from "sharp";

const GH_TOKEN = process.env.GH_TOKEN;
const headers = {
  ...(GH_TOKEN ? { Authorization: `Bearer ${GH_TOKEN}` } : {}),
  "User-Agent": "chandanSahoo-cs-card",
};

const USERNAME = "chandanSahoo-cs";

interface UserProfile {
  user: {
    age: string;
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
      codeforcesRating: number | string;
      codeforcesRank: string;
    };
    codechef: {
      codechefRating: number | string;
      codechefRank: string;
    };
    leetcode: {
      leetcodeRating: number | string;
    };
  };
}

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
  return `${years}y ${months}m ${days}d`;
};

// Static fallback data for each individual field
const staticProfileData: UserProfile = {
  user: {
    age: getCurrentAge(),
    stack: [
      "TypeScript",
      "JavaScript",
      "C++",
      "Go",
      "React",
      "Next.js",
      "Docker",
      "Git",
      "PostgreSQL",
      "MongoDB",
      "ConvexDB"
    ],
  },
  github: {
    blog: "https://chandansahoo.dev",
    html_url: `https://github.com/${USERNAME}`,
    userAvatar: "https://avatars.githubusercontent.com/u/108916377?v=4",
    stars: 6,
    lastCommitDate: "Recently Active",
    languages: ["TypeScript", "C++", "JavaScript", "Go"],
    followers: 19,
    public_repos: 44,
  },
  competitivePlatform: {
    codeforces: {
      codeforcesRating: 1233,
      codeforcesRank: "PUPIL",
    },
    codechef: {
      codechefRating: 1559,
      codechefRank: "2★ STAR",
    },
    leetcode: {
      leetcodeRating: 1778,
    },
  },
};

const getCompressedBase64Avatar = async (
  avatar_url: string,
): Promise<string> => {
  try {
    const response = await fetch(avatar_url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const buffer = await response.arrayBuffer();
    const compressedBuffer = await sharp(Buffer.from(buffer))
      .jpeg({ quality: 75 })
      .toBuffer();

    return `data:image/jpeg;base64,${compressedBuffer.toString("base64")}`;
  } catch (error) {
    console.error("Failed to compress avatar, using static fallback:", error);
    return staticProfileData.github.userAvatar;
  }
};

/**
 * Individual API fetchers with safe fallback on failure
 */
const fetchGitHubUser = async () => {
  try {
    const res = await fetch(`https://api.github.com/users/${USERNAME}`, {
      headers,
    });
    if (!res.ok) throw new Error(`GitHub User API error: ${res.status}`);
    const user = await res.json();
    const avatar = await getCompressedBase64Avatar(
      user.avatar_url || staticProfileData.github.userAvatar,
    );

    return {
      blog: user.blog || staticProfileData.github.blog,
      html_url: user.html_url || staticProfileData.github.html_url,
      userAvatar: avatar,
      public_repos: user.public_repos ?? staticProfileData.github.public_repos,
      followers: user.followers ?? staticProfileData.github.followers,
    };
  } catch (err) {
    console.error("GitHub User API failed, using static data:", err);
    return {
      blog: staticProfileData.github.blog,
      html_url: staticProfileData.github.html_url,
      userAvatar: staticProfileData.github.userAvatar,
      public_repos: staticProfileData.github.public_repos,
      followers: staticProfileData.github.followers,
    };
  }
};

const fetchGitHubRepos = async () => {
  try {
    const res = await fetch(
      `https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=pushed&direction=desc`,
      { headers },
    );
    if (!res.ok) throw new Error(`GitHub Repos API error: ${res.status}`);
    const repos = await res.json();

    if (!Array.isArray(repos))
      throw new Error("Repos response is not an array");

    const stars = repos.reduce(
      (sum: number, r: any) => sum + (r.stargazers_count || 0),
      0,
    );

    const lastCommitDate =
      repos[0]?.pushed_at || repos[0]?.updated_at
        ? new Date(
            repos[0].pushed_at || repos[0].updated_at,
          ).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "Asia/Kolkata",
          })
        : staticProfileData.github.lastCommitDate;

    const languagesMap = repos
      .filter((r: any) => r.language)
      .reduce((acc: any, r: any) => {
        acc[r.language] = (acc[r.language] || 0) + 1;
        return acc;
      }, {});

    const languagesArray =
      Object.keys(languagesMap).length > 0
        ? Object.keys(languagesMap)
        : staticProfileData.github.languages;

    return {
      stars,
      lastCommitDate,
      languages: languagesArray,
    };
  } catch (err) {
    console.error("GitHub Repos API failed, using static data:", err);
    return {
      stars: staticProfileData.github.stars,
      lastCommitDate: staticProfileData.github.lastCommitDate,
      languages: staticProfileData.github.languages,
    };
  }
};

const fetchCodeforces = async () => {
  try {
    const res = await fetch(
      "https://competeapi.vercel.app/user/codeforces/realmchan/",
    );
    if (!res.ok) throw new Error(`CF error: ${res.status}`);
    const data = await res.json();
    return {
      codeforcesRating:
        data?.[0]?.rating ??
        staticProfileData.competitivePlatform.codeforces.codeforcesRating,
      codeforcesRank:
        data?.[0]?.rank?.toUpperCase() ??
        staticProfileData.competitivePlatform.codeforces.codeforcesRank,
    };
  } catch (err) {
    console.error("Codeforces API failed, using static data:", err);
    return staticProfileData.competitivePlatform.codeforces;
  }
};

const fetchCodeChef = async () => {
  try {
    const res = await fetch(
      "https://competeapi.vercel.app/user/codechef/realm/",
    );
    if (!res.ok) throw new Error(`CC error: ${res.status}`);
    const data = await res.json();
    return {
      codechefRating:
        data?.rating_number ??
        staticProfileData.competitivePlatform.codechef.codechefRating,
      codechefRank: data?.rating
        ? `${String(data.rating).toUpperCase()[0]}★ STAR`
        : staticProfileData.competitivePlatform.codechef.codechefRank,
    };
  } catch (err) {
    console.error("CodeChef API failed, using static data:", err);
    return staticProfileData.competitivePlatform.codechef;
  }
};

const fetchLeetCode = async () => {
  try {
    const res = await fetch(
      "https://competeapi.vercel.app/user/leetcode/realmchan/",
    );
    if (!res.ok) throw new Error(`LC error: ${res.status}`);
    const data = await res.json();
    const rating = data?.data?.userContestRanking?.rating;
    return {
      leetcodeRating: rating
        ? Math.floor(rating)
        : staticProfileData.competitivePlatform.leetcode.leetcodeRating,
    };
  } catch (err) {
    console.error("LeetCode API failed, using static data:", err);
    return staticProfileData.competitivePlatform.leetcode;
  }
};

/**
 * Fetches all services concurrently with isolated fault tolerance.
 */
const fetchedData = async (): Promise<UserProfile> => {
  const [ghUser, ghRepos, cfData, ccData, lcData] = await Promise.all([
    fetchGitHubUser(),
    fetchGitHubRepos(),
    fetchCodeforces(),
    fetchCodeChef(),
    fetchLeetCode(),
  ]);

  return {
    user: {
      age: getCurrentAge(),
      stack: staticProfileData.user.stack,
    },
    github: {
      blog: ghUser.blog,
      html_url: ghUser.html_url,
      userAvatar: ghUser.userAvatar,
      stars: ghRepos.stars,
      lastCommitDate: ghRepos.lastCommitDate,
      languages: ghRepos.languages,
      public_repos: ghUser.public_repos,
      followers: ghUser.followers,
    },
    competitivePlatform: {
      codeforces: cfData,
      codechef: ccData,
      leetcode: lcData,
    },
  };
};

/**
 * Renders the terminal SVG card with original theme styling.
 */
function renderTerminalCard(data: UserProfile, isOffline = false): string {
  const { user, github, competitivePlatform } = data;

  return `<svg width="920" height="780" viewBox="0 0 920 780" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="headerGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#161b22"/>
      <stop offset="100%" stop-color="#21262d"/>
    </linearGradient>
    <clipPath id="avatarClip">
      <rect x="48" y="128" width="112" height="112" rx="10" />
    </clipPath>
    <style>
      @keyframes blink {
        0%, 49% { opacity: 1; }
        50%, 100% { opacity: 0; }
      }
      .cursor { animation: blink 1s infinite; fill: #22d3ee; }
      .terminal-bg { fill: #0d1117; }
      .header-bg { fill: url(#headerGrad); }
      .window-border { stroke: #30363d; stroke-width: 1.5; }
      .panel { fill: #161b22; stroke: #30363d; stroke-width: 1; rx: 8px; }
      
      .dot-red { fill: #ff5f56; }
      .dot-yellow { fill: #ffbd2e; }
      .dot-green { fill: #27c93f; }
      .prompt { fill: #a855f7; font-family: 'Fira Code', monospace; font-size: 13px; }
      .command { fill: #22d3ee; font-family: 'Fira Code', monospace; font-size: 13px; }
      .text { fill: #c9d1d9; font-family: 'Fira Code', monospace; font-size: 13px; }
      .label { fill: #7d8590; font-family: 'Fira Code', monospace; font-size: 13px; }
      .link { fill: #58a6ff; font-family: 'Fira Code', monospace; font-size: 13px; }
      .accent { fill: #f97316; font-family: 'Fira Code', monospace; font-size: 13px; font-weight: 600; }
      .success { fill: #3fb950; font-family: 'Fira Code', monospace; font-size: 13px; }
      .info { fill: #58a6ff; font-family: 'Fira Code', monospace; font-size: 13px; }
      .titleText { fill: #e6edf3; font-family: 'Fira Code', monospace; font-size: 18px; font-weight: bold; }
      .subTitle { fill: #7d8590; font-family: 'Fira Code', monospace; font-size: 13px; }
    </style>
  </defs>
  <!-- Terminal Window Background -->
  <rect width="920" height="780" rx="10" class="terminal-bg window-border" />
  <!-- Terminal Header Bar -->
  <rect width="920" height="38" rx="10" class="header-bg" />
  <rect y="24" width="920" height="14" class="header-bg" />
  <line x1="0" y1="38" x2="920" y2="38" stroke="#30363d" stroke-width="1.5" />
  <!-- Window Controls -->
  <circle cx="22" cy="19" r="6" class="dot-red" />
  <circle cx="42" cy="19" r="6" class="dot-yellow" />
  <circle cx="62" cy="19" r="6" class="dot-green" />
  <!-- Window Title -->
  <text x="460" y="24" text-anchor="middle" class="label">
    ${USERNAME}@github: ~/${USERNAME}
  </text>
  ${
    isOffline
      ? `<text x="890" y="24" text-anchor="end" class="label">● cached</text>`
      : `<text x="890" y="24" text-anchor="end" class="success">● active</text>`
  }
  <!-- Prompt Line 1: Fastfetch -->
  <text x="24" y="66" class="prompt">
    $ <tspan class="command">fastfetch</tspan>
  </text>
  <!-- Main Profile Info Panel -->
  <rect x="24" y="82" width="872" height="184" class="panel" />
  <!-- Avatar Container -->
  <rect x="46" y="126" width="116" height="116" rx="12" fill="#21262d" stroke="#58a6ff" stroke-width="1.5" />
  <image x="48" y="128" width="112" height="112" href="${github.userAvatar}" clip-path="url(#avatarClip)" />
  <!-- Profile Title -->
  <text x="184" y="118" class="titleText">${USERNAME}</text>
  <text x="184" y="138" class="subTitle">@${USERNAME} • Software Developer</text>
  <line x1="184" y1="150" x2="860" y2="150" stroke="#30363d" stroke-width="1" />
  <!-- Specs (Left Column) -->
  <text x="184" y="174" class="label">Host</text>
  <text x="304" y="174" class="text">Delhi, India (IST)</text>
  <text x="184" y="198" class="label">Uptime</text>
  <text x="304" y="198" class="text">${user.age}</text>
  <text x="184" y="222" class="label">Followers</text>
  <text x="304" y="222" class="text">${github.followers} followers</text>
  <text x="184" y="246" class="label">Last Activity</text>
  <text x="304" y="246" class="text">${github.lastCommitDate}</text>
  <!-- Specs (Right Column) -->
  <text x="540" y="174" class="label">Stars</text>
  <text x="660" y="174" class="text">${github.stars} stars</text>
  <text x="540" y="198" class="label">Public Repos</text>
  <text x="660" y="198" class="text">${github.public_repos} repos</text>
  <!-- Prompt Line 2: Stack -->
  <text x="24" y="298" class="prompt">
    $ <tspan class="command">git log --stack --oneline</tspan>
  </text>
  <!-- Stack Panel -->
  <rect x="24" y="314" width="872" height="50" class="panel" />
  <text x="40" y="345" class="text">
    ${user.stack.join(" • ")}
  </text>
  <!-- Prompt Line 3: Competitive Stats -->
  <text x="24" y="396" class="prompt">
    $ <tspan class="command">git log --profiles</tspan>
  </text>
  <!-- Competitive Programming Panel -->
  <rect x="24" y="412" width="872" height="106" class="panel" />
  <!-- Codeforces -->
  <text x="40" y="440" class="label">Codeforces</text>
  <a href="https://codeforces.com/profile/Realmchan" target="_blank">
    <text x="200" y="440" class="text">Realmchan</text>
  </a>
  <text x="380" y="440" class="text">${competitivePlatform.codeforces.codeforcesRating}</text>
  <text x="560" y="440" class="accent">${competitivePlatform.codeforces.codeforcesRank}</text>
  <!-- CodeChef -->
  <text x="40" y="468" class="label">CodeChef</text>
  <a href="https://www.codechef.com/users/realm" target="_blank">
    <text x="200" y="468" class="text">realm</text>
  </a>
  <text x="380" y="468" class="text">${competitivePlatform.codechef.codechefRating}</text>
  <text x="560" y="468" class="accent">${competitivePlatform.codechef.codechefRank}</text>
  <!-- LeetCode -->
  <text x="40" y="496" class="label">LeetCode</text>
  <a href="https://leetcode.com/realmchan" target="_blank">
    <text x="200" y="496" class="text">realmchan</text>
  </a>
  <text x="380" y="496" class="text">${competitivePlatform.leetcode.leetcodeRating}</text>
  <text x="560" y="496" class="success">Active</text>
  <!-- Prompt Line 4: Connect -->
  <text x="24" y="548" class="prompt">
    $ <tspan class="command">git ping -c1 chandansahoo.dev</tspan>
  </text>
  <!-- Contact Panel -->
  <rect x="24" y="564" width="872" height="90" class="panel" />
  <text x="40" y="594" class="label">Email</text>
  <a href="mailto:chandansahoo02468@gmail.com" target="_blank">
    <text x="130" y="594" class="link">chandansahoo02468@gmail.com</text>
  </a>
  <text x="500" y="594" class="label">GitHub</text>
  <a href="https://github.com/chandanSahoo-cs" target="_blank">
    <text x="590" y="594" class="link">github.com/chandanSahoo-cs</text>
  </a>
  <text x="40" y="626" class="label">LinkedIn</text>
  <a href="https://linkedin.com/in/chandansahoo-cs" target="_blank">
    <text x="130" y="626" class="link">in/chandansahoo-cs</text>
  </a>
  <text x="500" y="626" class="label">Discord</text>
  <a href="https://discord.com/users/chandansahoo" target="_blank">
    <text x="590" y="626" class="link">@chandansahoo</text>
  </a>
  <!-- Prompt Line 5: Switch Command & Status Output -->
  <text x="24" y="684" class="prompt">
    $ <tspan class="command">gh-shell switch --keep-history</tspan>
  </text>
  <text x="24" y="706" class="text">
    Migrating history... done
  </text>
  <text x="24" y="726" class="text">
    Applying theme: github-readme ✓
  </text>
  <!-- Final Active Terminal Cursor Line -->
  <text x="24" y="752" class="prompt">
    $ <tspan class="cursor">█</tspan>
  </text>
  <!-- ANSI Color Swatches -->
  <g transform="translate(660, 742)">
    <rect x="0" width="11" height="11" rx="2" fill="#ff5f56" />
    <rect x="16" width="11" height="11" rx="2" fill="#ffbd2e" />
    <rect x="32" width="11" height="11" rx="2" fill="#27c93f" />
    <rect x="48" width="11" height="11" rx="2" fill="#58a6ff" />
    <rect x="64" width="11" height="11" rx="2" fill="#a855f7" />
    <rect x="80" width="11" height="11" rx="2" fill="#f97316" />
    <rect x="96" width="11" height="11" rx="2" fill="#3fb950" />
    <rect x="112" width="11" height="11" rx="2" fill="#22d3ee" />
  </g>
</svg>
`;
}

const fallbackSVG = renderTerminalCard(staticProfileData, true);

/**
 * Generates the SVG string from live or provided data.
 */
const profileSVG = async (
  providedData?: UserProfile | null,
): Promise<string> => {
  try {
    const data = providedData || (await fetchedData());
    return renderTerminalCard(data, false);
  } catch (error) {
    console.error("Error generating profile SVG:", error);
    return fallbackSVG;
  }
};

export { fallbackSVG, fetchedData, profileSVG, type UserProfile };
/* eslint-enable @typescript-eslint/no-explicit-any */
