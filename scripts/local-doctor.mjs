import { existsSync, readFileSync } from "node:fs";
import net from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const isWindows = process.platform === "win32";
const npxBin = isWindows ? "npx.cmd" : "npx";

const checks = [];
const warnings = [];
const failures = [];

function ok(message) {
  checks.push({ status: "OK", message });
}

function warn(message) {
  warnings.push(message);
  checks.push({ status: "WARN", message });
}

function fail(message) {
  failures.push(message);
  checks.push({ status: "FAIL", message });
}

function readEnvFile(path) {
  if (!existsSync(path)) return {};
  const env = {};
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equals = line.indexOf("=");
    if (equals === -1) continue;
    env[line.slice(0, equals).trim()] = line.slice(equals + 1).trim();
  }
  return env;
}

function isPortOpen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(true));
    server.once("listening", () => {
      server.close(() => resolve(false));
    });
    server.listen(port, "127.0.0.1");
  });
}

function run(command, args, timeout = 15000) {
  return spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    timeout,
    shell: false,
  });
}

function hasConvexUrlShape(value) {
  return /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)?\.convex\.cloud$/i.test(value);
}

const packageJsonPath = join(root, "package.json");
const envLocalPath = join(root, ".env.local");
const convexJsonPath = join(root, "convex", "convex.json");
const generatedApiPath = join(root, "convex", "_generated", "api.d.ts");
const nodeModulesPath = join(root, "node_modules");

console.log("GymLogs local doctor");
console.log(`Project: ${root}`);
console.log("");

if (existsSync(packageJsonPath)) ok("package.json found. You are in the right project.");
else fail("package.json missing. Run this from C:\\Users\\Buki\\Documents\\GymLogs.");

if (existsSync(nodeModulesPath)) ok("node_modules found.");
else fail("node_modules missing. Run: npm.cmd install");

if (existsSync(envLocalPath)) ok(".env.local found.");
else fail(".env.local missing. Copy .env.example to .env.local and fill values.");

const env = readEnvFile(envLocalPath);
const convexUrl = env.NEXT_PUBLIC_CONVEX_URL ?? "";
if (!convexUrl) {
  fail("NEXT_PUBLIC_CONVEX_URL is missing in .env.local.");
} else if (!hasConvexUrlShape(convexUrl)) {
  warn(`NEXT_PUBLIC_CONVEX_URL looks unusual: ${convexUrl}`);
} else {
  ok(`NEXT_PUBLIC_CONVEX_URL set: ${convexUrl}`);
}

if (convexUrl.includes("pleasant-hawk-000")) {
  fail("NEXT_PUBLIC_CONVEX_URL points to old pleasant-hawk-000. Use the current Convex deployment URL.");
}

if (!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  warn("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY missing. Clerk keyless mode may work locally, but team setup should use real keys.");
} else {
  ok("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY set.");
}

if (!env.CLERK_SECRET_KEY) {
  warn("CLERK_SECRET_KEY missing. Server-side Clerk features may not work fully.");
} else {
  ok("CLERK_SECRET_KEY set.");
}

if (existsSync(convexJsonPath)) ok("convex/convex.json found.");
else fail("convex/convex.json missing.");

if (existsSync(generatedApiPath)) ok("Convex generated API files found.");
else fail("Convex generated API files missing. Run: npm.cmd run convex:dev");

const loginStatus = run(npxBin, ["convex", "login", "status"], 20000);
if (loginStatus.status === 0) {
  ok("Convex CLI login detected.");
} else {
  warn('Convex CLI is not logged in or cannot check login. Run: npx.cmd convex login --device-name "Buki-PC"');
}

if (await isPortOpen(3000)) {
  warn("Port 3000 is already in use. Next may start on 3001/3002, or stop the old process first.");
} else {
  ok("Port 3000 is free.");
}

if (await isPortOpen(3002)) {
  warn("Port 3002 is already in use.");
}

console.log("Checks:");
for (const check of checks) {
  console.log(`[${check.status}] ${check.message}`);
}

console.log("");
if (failures.length > 0) {
  console.log("Fix these first:");
  for (const message of failures) console.log(`- ${message}`);
  console.log("");
  console.log("Recommended reset flow:");
  console.log("1. cd C:\\Users\\Buki\\Documents\\GymLogs");
  console.log("2. npm.cmd install");
  console.log('3. npx.cmd convex login --device-name "Buki-PC"');
  console.log("4. npm.cmd run convex:dev");
  console.log("5. Open a second terminal and run: npm.cmd run convex:seed");
  console.log("6. npm.cmd run dev");
  process.exit(1);
}

if (warnings.length > 0) {
  console.log("Warnings:");
  for (const message of warnings) console.log(`- ${message}`);
  console.log("");
}

console.log("Looks good enough to start locally.");
console.log("Run in terminal 1: npm.cmd run convex:dev");
console.log("Run in terminal 2: npm.cmd run dev");
