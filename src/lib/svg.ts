/* eslint-disable @typescript-eslint/no-explicit-any */
import sharp from "sharp";

const GH_TOKEN = process.env.GH_TOKEN; // set in Vercel project settings
const headers = {
  Authorization: `Bearer ${GH_TOKEN}`,
  "User-Agent": "chandanSahoo-cs-card", // required by GitHub API
};

const USERNAME = "chandanSahoo-cs";

const fallbackSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="120" style="background:#0d1117; font-family: monospace;">
    <style>
    .terminal-bg { fill: #0d1117; }
    .terminal-border { fill: none; stroke: #30363d; stroke-width: 2; }
    .header-bg { fill: #21262d; }
        .dot-red { fill: #ff5f56; }
        .dot-yellow { fill: #ffbd2e; }
        .dot-green { fill: #27c93f; }
        .prompt { fill: #7c3aed; font-family: 'Fira Code', monospace; font-size: 14px; }
        .text { fill: #00ff00; font-family: 'Fira Code', monospace; font-size: 14px; }
        </style>
        <rect width="100%" height="100%" fill="#0d1117" />
        <text x="20" y="40" class="prompt">$ git connect ${"https://github.com/chandanSahoo-cs"}</text>
        <text x="20" y="70" class="text">Sorry for inconvenience</text>
        <text x="20" y="90" class="text">Please reload the page :)</text>
        </svg>
        `;

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

const getCompressedBase64Avatar = async (
  avatar_url: string
): Promise<string> => {
  try {
    const response = await fetch(avatar_url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();

    const compressedBuffer = await sharp(Buffer.from(buffer))
      .jpeg({ quality: 70 })
      .toBuffer();

    const base64 = compressedBuffer.toString("base64");

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

const fetchedData = async (): Promise<UserProfile | null> => {
  try {
    const userRes = await fetch(`https://api.github.com/users/${USERNAME}`, {
      headers,
    });
    const user = await userRes.json();
    const userAvatar = await getCompressedBase64Avatar(user.avatar_url);

    // fetch repos to count stars
    const repoRes = await fetch(
      `https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=pushed&direction=des`,
      {
        headers,
      }
    );
    const repos = await repoRes.json();
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
    const codeforces = await fetch(
      "https://competeapi.vercel.app/user/codeforces/realmchan/"
    );
    const codeforcesDetails = await codeforces.json();
    const codeforcesRating = await codeforcesDetails[0].rating;
    const codeforcesRank = await codeforcesDetails[0].rank.toUpperCase();

    const codechef = await fetch(
      "https://competeapi.vercel.app/user/codechef/realm/"
    );
    const codechefDetails = await codechef.json();
    const codechefRating = await codechefDetails.rating_number;
    const codechefRank =
      (await codechefDetails.rating.toUpperCase()[0]) + " STAR";

    const leetcode = await fetch(
      "https://competeapi.vercel.app/user/leetcode/realmchan/"
    );
    const leetcodeDetails = await leetcode.json();
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

const profileSVG = async () => {
  try {
    const data = await fetchedData();
    console.log(data);
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
      data.competitivePlatform.codeforces.codeforcesRating;
    const codeforcesRank = data.competitivePlatform.codeforces.codeforcesRank;

    const codechefRating = data.competitivePlatform.codechef.codechefRating;
    const codechefRank = data.competitivePlatform.codechef.codechefRank;

    const leetcodeRating = data.competitivePlatform.leetcode.leetcodeRating;

    const svg = `
  <svg width="1400" height="950" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        .terminal-bg { fill: #0d1117; }
        .terminal-border { fill: none; stroke: #30363d; stroke-width: 2; }
        .header-bg { fill: #21262d; }
        .dot-red { fill: #ff5f56; }
        .dot-yellow { fill: #ffbd2e; }
        .dot-green { fill: #27c93f; }
        .prompt { fill: #7c3aed; font-family: 'Fira Code', monospace; font-size: 18px; }
        .command { fill: #22d3ee; font-family: 'Fira Code', monospace; font-size: 18px; }
        .text { fill: #e6edf3; font-family: 'Fira Code', monospace; font-size: 18px; }
        .link {fill: #3a7be5; font-family: 'Fira Code', monospace; font-size: 18px; }
        .accent { fill: #f97316; font-family: 'Fira Code', monospace; font-size: 18px; }
        .success { fill: #22c55e; font-family: 'Fira Code', monospace; font-size: 18px; }
        .info { fill: #3b82f6; font-family: 'Fira Code', monospace; font-size: 18px; }
      </style>
    </defs>
    <!-- Header bar -->
    <rect width="100%" height="100%" class="terminal-bg"/>
    <rect width="100%" height="35" class="header-bg"/>
    <circle cx="20" cy="17.5" r="6" class="dot-red"/>
    <circle cx="40" cy="17.5" r="6" class="dot-yellow"/>
    <circle cx="60" cy="17.5" r="6" class="dot-green"/>
    <text x="400" y="25" class="text" text-anchor="middle">chandanSahoo-cs@github:~$</text>
    
      <!-- Entry -->
      <text x="20" y="60" class="prompt">$ git connect ${
        data.github.blog || data.github.html_url
      }</text>
      <text x="20" y="85" class="success">✓ Connection established</text>
      <!-- Terminal Background -->
  
  
    
    <!-- neofetch -->
    <text x="20" y="125" class="prompt">┌──(</text>
    <text x="65" y="125" class="success">dev</text>
    <text x="105" y="125" class="prompt">㉿</text>
    <text x="130" y="125" class="info">github</text>
    <text x="197" y="125" class="prompt"> )-[</text>
    <text x="230" y="125" class="accent">~</text>
    <text x="240" y="125" class="prompt">]</text>
    <text x="20" y="145" class="prompt">└─</text>
    <text x="50" y="145" class="command">$ git log --whoami</text>
    
    <!-- Neofetch Header -->
    <text x="180" y="170" class="success" font-size="18" font-weight="bold">${USERNAME}</text>
    <text x="180" y="190" class="accent">@${USERNAME}</text>
    
    <!-- Profile Picture (ASCII Art Style) -->
    <rect x="20" y="210" width="120" height="120" rx="60" fill="#30363d" stroke="#58a6ff" stroke-width="2"/>
    <image x="25" y="215" width="110" height="110" href="${userAvatar}" clip-path="circle(55px at 55px 55px)"/>
  
    <!-- Stats Section -->
    <text x="180" y="215" class="info">OS</text>
    <text x="340" y="215" class="text">Arch Linux</text>
  
    <text x="180" y="235" class="info">Host</text>
    <text x="340" y="235" class="text">${"Delhi, India"}</text>
  
    <text x="180" y="255" class="info">Uptime</text>
    <text x="340" y="255" class="text">${age}</text>
  
    <text x="180" y="275" class="info">Public Repos</text>
    <text x="340" y="275" class="text">${data.github.public_repos} repos</text>
  
    <text x="180" y="295" class="info">Languages</text>
    <text x="340" y="295" class="text">${languages.join(" • ")}</text>
  
    <text x="180" y="315" class="info">Stars</text>
    <text x="340" y="315" class="text">${stars} stars</text>
    
    <text x="180" y="335" class="info">Followers</text>
    <text x="340" y="335" class="text">${data.github.followers} followers</text>
    
    <text x="180" y="355" class="info">Last Commit</text>
    <text x="340" y="355" class="text">${lastCommitDate}</text>
  
    <!-- Color Palette -->
    <text x="30" y="385" class="text">Colors:</text>
    <rect x="30" y="395" width="20" height="20" fill="#ff5f56"/>
    <rect x="55" y="395" width="20" height="20" fill="#ffbd2e"/>
    <rect x="80" y="395" width="20" height="20" fill="#27c93f"/>
    <rect x="105" y="395" width="20" height="20" fill="#3b82f6"/>
    <rect x="130" y="395" width="20" height="20" fill="#7c3aed"/>
    <rect x="155" y="395" width="20" height="20" fill="#f97316"/>
    <rect x="180" y="395" width="20" height="20" fill="#22c55e"/>
    <rect x="205" y="395" width="20" height="20" fill="#22d3ee"/>
    
    <!-- stack -->
    <text x="20" y="455" class="prompt">┌──(</text>
    <text x="65" y="455" class="success">dev</text>
    <text x="105" y="455" class="prompt">㉿</text>
    <text x="130" y="455" class="info">github</text>
    <text x="197" y="455" class="prompt"> )-[</text>
    <text x="230" y="455" class="accent">~</text>
    <text x="240" y="455" class="prompt">]</text>
    <text x="20" y="475" class="prompt">└─</text>
    <text x="50" y="475" class="command">$ git log --stack --oneline</text>
    
    <!-- Stack Section -->
    <text x="20" y="500" class="text">Stack (used so far): ${stack.join(
      " • "
    )}</text>  

    <!-- profiles -->
    <text x="20" y="540" class="prompt">┌──(</text>
    <text x="65" y="540" class="success">dev</text>
    <text x="105" y="540" class="prompt">㉿</text>
    <text x="130" y="540" class="info">github</text>
    <text x="197" y="540" class="prompt"> )-[</text>
    <text x="230" y="540" class="accent">~</text>
    <text x="240" y="540" class="prompt">]</text>
    <text x="20" y="560" class="prompt">└─</text>
    <text x="50" y="560" class="command">$ git log --profiles</text>
    
    <!-- Profile Section -->
    <text x="20" y="585" class="text">Codeforces</text>
    <a href="https://codeforces.com/profile/Realmchan" target="_blank" rel="noopener noreferrer">
    <text x="160" y="585" class="text">Realmchan | ${codeforcesRating} | ${codeforcesRank} </text>
    </a>
    <text x="20" y="605" class="text" >CodeChef</text>
    <a href="https://www.codechef.com/users/realm" target="_blank" rel="noopener noreferrer">
    <text x="160" y="605" class="text">Realm | ${codechefRating} | ${codechefRank} </text>
    </a>
    <text x="20" y="625" class="text">Leetcode</text>
    <a href="https://leetcode.com/realmchan" target="_blank" rel="noopener noreferrer">
    <text x="160" y="625" class="text">Realmchan | ${leetcodeRating} </text>
    </a>
    
    <!-- connect -->
    <text x="20" y="665" class="prompt">┌──(</text>
    <text x="65" y="665" class="success">dev</text>
    <text x="105" y="665" class="prompt">㉿</text>
    <text x="130" y="665" class="info">github</text>
    <text x="197" y="665" class="prompt"> )-[</text>
    <text x="230" y="665" class="accent">~</text>
    <text x="240" y="665" class="prompt">]</text>
    <text x="20" y="685" class="prompt">└─</text>
    <text x="50" y="685" class="command">$ git ping -c1 chandansahoo.dev</text>
  
    <!-- Connect Section -->
    <text x="20" y="715" class="text">Email</text>
    <a href="mailto:chandansahoo02468@gmail.com" target="_blank" rel="noopener noreferrer">
    <text x="160" y="715" class="text">chandansahoo02468@gmail.com</text>
    </a>
    <text x="20" y="735" class="text" >LinkedIn</text>
    <a href="https://linkedin.com/in/chandansahoo-cs" target="_blank" rel="noopener noreferrer">
    <text x="160" y="735" class="text">chandansahoo-cs</text>
    </a>
    <text x="20" y="755" class="text">Github</text>
    <a href="https://github.com/chandanSahoo-cs" target="_blank" rel="noopener noreferrer">
    <text x="160" y="755" class="text">chandanSahoo-cs</text>
    </a>
    <text x="20" y="775" class="text">Discord</text>
    <a href="https://discord.com/users/chandansahoo" target="_blank" rel="noopener noreferrer">
    <text x="160" y="775" class="text">chandansahoo</text>
    </a>

    <!-- switch -->
    <text x="20" y="815" class="prompt">┌──(</text>
    <text x="65" y="815" class="success">dev</text>
    <text x="105" y="815" class="prompt">㉿</text>
    <text x="130" y="815" class="info">github</text>
    <text x="197" y="815" class="prompt"> )-[</text>
    <text x="230" y="815" class="accent">~</text>
    <text x="240" y="815" class="prompt">]</text>
    <text x="20" y="835" class="prompt">└─</text>
    <text x="50" y="835" class="command">$ gh-shell switch --keep-history</text>

    <text x="20" y="860" class="text">Switching</text>
    <text x="20" y="880" class="text">Migrating history... done</text>
    <text x="20" y="900" class="text">Applying theme: github-readme</text>
    </svg>
    `;
    return svg;
  } catch (error) {
    console.error("Error :: ", error);
    return fallbackSVG;
  }
};

export { type UserProfile, fetchedData, profileSVG, fallbackSVG };

/* eslint-enable @typescript-eslint/no-explicit-any */
