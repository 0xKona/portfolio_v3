import { IconType } from "react-icons";
import {
  FaAndroid,
  FaAngular,
  FaAppStore,
  FaAppStoreIos,
  FaApple,
  FaAws,
  FaBitbucket,
  FaBluetooth,
  FaBrain,
  FaBootstrap,
  FaBug,
  FaCentos,
  FaChartBar,
  FaChartLine,
  FaChartPie,
  FaCloud,
  FaCloudflare,
  FaCode,
  FaCodeBranch,
  FaCodeCommit,
  FaCodeCompare,
  FaCodeFork,
  FaCodeMerge,
  FaCodePullRequest,
  FaCodepen,
  FaConfluence,
  FaCube,
  FaCubes,
  FaCss3,
  FaCss3Alt,
  FaDatabase,
  FaDebian,
  FaDesktop,
  FaDev,
  FaDigitalOcean,
  FaDiscord,
  FaDrupal,
  FaEthernet,
  FaFedora,
  FaFigma,
  FaFingerprint,
  FaFlask,
  FaFreebsd,
  FaGlobe,
  FaGolang,
  FaGoogle,
  FaGooglePlay,
  FaHardDrive,
  FaHashnode,
  FaHtml5,
  FaJava,
  FaJira,
  FaJoomla,
  FaJs,
  FaKey,
  FaLaptopCode,
  FaLess,
  FaLinux,
  FaLock,
  FaMagento,
  FaMarkdown,
  FaMedium,
  FaMemory,
  FaMicrochip,
  FaMicrosoft,
  FaMobileScreen,
  FaNetworkWired,
  FaNode,
  FaNodeJs,
  FaNpm,
  FaPhp,
  FaPython,
  FaRaspberryPi,
  FaReact,
  FaRedhat,
  FaRobot,
  FaRust,
  FaSass,
  FaServer,
  FaShield,
  FaShopify,
  FaSitemap,
  FaSketch,
  FaSlack,
  FaSquarespace,
  FaStackOverflow,
  FaSuse,
  FaSwift,
  FaTerminal,
  FaTrello,
  FaUbuntu,
  FaUnity,
  FaUsb,
  FaVial,
  FaVuejs,
  FaWifi,
  FaWindows,
  FaWix,
  FaWordpress,
  FaYarn,
} from "react-icons/fa6";
import {
  SiClaude,
  SiCplusplus,
  SiDocker,
  SiGraphql,
  SiMysql,
  SiNextdotjs,
  SiPostgresql,
  SiSqlite,
  SiTailwindcss,
  SiTypescript,
  SiVercel,
} from "react-icons/si";
import { TbLambda } from "react-icons/tb";
import { IoLogoAmplify } from "react-icons/io5";

export const SKILL_ICONS = {
  /** Languages */
  javascript: FaJs,
  js: FaJs,
  typescript: SiTypescript,
  ts: SiTypescript,
  python: FaPython,
  java: FaJava,
  php: FaPhp,
  rust: FaRust,
  go: FaGolang,
  golang: FaGolang,
  swift: FaSwift,
  "c++": SiCplusplus,
  cpp: SiCplusplus,

  /** Frontend Frameworks & Libraries */
  react: FaReact,
  "react-native": FaReact,
  nextjs: SiNextdotjs,
  "next.js": SiNextdotjs,
  tailwindcss: SiTailwindcss,
  tailwind: SiTailwindcss,
  angular: FaAngular,
  vue: FaVuejs,
  vuejs: FaVuejs,

  /** Web Technologies */
  html: FaHtml5,
  html5: FaHtml5,
  css: FaCss3,
  css3: FaCss3Alt,
  sass: FaSass,
  scss: FaSass,
  less: FaLess,
  bootstrap: FaBootstrap,
  markdown: FaMarkdown,

  /** Runtime & Package Managers */
  node: FaNode,
  nodejs: FaNodeJs,
  npm: FaNpm,
  yarn: FaYarn,

  /** Backend Services & APIs */
  "aws-amplify": IoLogoAmplify,
  amplify: IoLogoAmplify,
  "aws-lambda": TbLambda,
  lambda: TbLambda,
  graphql: SiGraphql,
  postgresql: SiPostgresql,
  postgres: SiPostgresql,
  mysql: SiMysql,
  sqlite: SiSqlite,
  "aws-dynamodb": FaAws,
  dynamodb: FaAws,

  /** Version Control */
  bitbucket: FaBitbucket,

  /** Cloud Providers */
  aws: FaAws,
  amazon: FaAws,
  docker: SiDocker,
  google: FaGoogle,
  gcp: FaGoogle,
  microsoft: FaMicrosoft,
  azure: FaMicrosoft,
  cloudflare: FaCloudflare,
  digitalocean: FaDigitalOcean,
  vercel: SiVercel,
  "aws-cdk": FaAws,
  "aws-step-functions": FaAws,
  "step-functions": FaAws,

  /** Operating Systems */
  linux: FaLinux,
  ubuntu: FaUbuntu,
  redhat: FaRedhat,
  centos: FaCentos,
  fedora: FaFedora,
  suse: FaSuse,
  debian: FaDebian,
  freebsd: FaFreebsd,
  windows: FaWindows,
  apple: FaApple,
  macos: FaApple,

  /** Mobile */
  android: FaAndroid,
  ios: FaApple,
  appstore: FaAppStore,
  "appstore-ios": FaAppStoreIos,
  playstore: FaGooglePlay,
  googleplay: FaGooglePlay,

  /** CMS & E-commerce */
  wordpress: FaWordpress,
  drupal: FaDrupal,
  joomla: FaJoomla,
  magento: FaMagento,
  shopify: FaShopify,
  squarespace: FaSquarespace,
  wix: FaWix,

  /** Design Tools */
  figma: FaFigma,
  sketch: FaSketch,

  /** Project Management & Collaboration */
  trello: FaTrello,
  jira: FaJira,
  confluence: FaConfluence,
  slack: FaSlack,
  discord: FaDiscord,

  /** Developer Communities */
  stackoverflow: FaStackOverflow,
  dev: FaDev,
  medium: FaMedium,
  hashnode: FaHashnode,
  codepen: FaCodepen,

  /** Game Engines */
  unity: FaUnity,

  /** Hardware */
  raspberrypi: FaRaspberryPi,
  microchip: FaMicrochip,
  memory: FaMemory,
  harddrive: FaHardDrive,

  /** Generic Development Icons */
  database: FaDatabase,
  db: FaDatabase,
  server: FaServer,
  terminal: FaTerminal,
  cli: FaTerminal,
  code: FaCode,
  "code-branch": FaCodeBranch,
  "code-commit": FaCodeCommit,
  "code-compare": FaCodeCompare,
  "code-fork": FaCodeFork,
  "code-merge": FaCodeMerge,
  "code-pr": FaCodePullRequest,
  "pull-request": FaCodePullRequest,

  /** Architecture & Infrastructure */
  cubes: FaCubes,
  microservices: FaCubes,
  cube: FaCube,
  network: FaNetworkWired,
  sitemap: FaSitemap,
  cloud: FaCloud,

  /** Devices */
  laptop: FaLaptopCode,
  mobile: FaMobileScreen,
  desktop: FaDesktop,

  /** Testing & Debugging */
  bug: FaBug,
  test: FaVial,
  flask: FaFlask,

  /** AI Tools */
  "kiro-cli": FaTerminal,
  "kiro-ide": FaLaptopCode,
  "github-copilot": FaRobot,
  claude: SiClaude,
  "agentic-ai": FaRobot,

  /** AI & Data */
  robot: FaRobot,
  ai: FaRobot,
  brain: FaBrain,
  ml: FaBrain,
  "chart-line": FaChartLine,
  analytics: FaChartLine,
  "chart-bar": FaChartBar,
  "chart-pie": FaChartPie,

  /** Security */
  lock: FaLock,
  security: FaShield,
  shield: FaShield,
  key: FaKey,
  fingerprint: FaFingerprint,
  auth: FaFingerprint,

  /** Connectivity */
  globe: FaGlobe,
  web: FaGlobe,
  wifi: FaWifi,
  bluetooth: FaBluetooth,
  usb: FaUsb,
  ethernet: FaEthernet,
} as const;

export type SkillKey = keyof typeof SKILL_ICONS;

export const SKILL_ICON_NAMES = Object.keys(SKILL_ICONS) as SkillKey[];

export const CORE_SKILLS: SkillKey[] = [
  "typescript",
  "react",
  "nextjs",
  "aws",
  "aws-amplify",
  "golang",
  "python",
  "nodejs",
  "tailwindcss",
  "agentic-ai",
  "docker",
  "aws-lambda",
];

export function isValidIconName(name: string): name is SkillKey {
  return name in SKILL_ICONS;
}

export function getSkillIcon(name: string): IconType | null {
  if (!name || !isValidIconName(name)) return null;
  return SKILL_ICONS[name];
}
