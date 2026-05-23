const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const http = require("http");

// 1. Create the express application
const app = express();
app.use(cors());
app.use(helmet());

// Scenario A: Without rate limiting (raw performance)
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", message: "HireSight API Running" });
});

// Scenario B: With rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // max 100 requests per 15 mins
  message: "Too many requests from this IP"
});

app.get("/api/rate-limited-endpoint", limiter, (req, res) => {
  res.json({ status: "ok" });
});

// Start the server on a dynamic local port
const PORT = 5999;
const server = app.listen(PORT, () => {
  console.log(`\n[Benchmark Server] Listening on http://localhost:${PORT}`);
  runBenchmarks();
});

// Native HTTP client request helper
function makeRequest(path) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${PORT}${path}`, (res) => {
      res.resume(); // Consume stream
      resolve(res.statusCode);
    });
    req.on("error", () => {
      resolve(500);
    });
  });
}

async function runTest(name, path, concurrency, total) {
  console.log(`\nRunning Test: ${name}`);
  console.log(`- Concurrency: ${concurrency} virtual users`);
  console.log(`- Total Requests: ${total}`);

  const start = Date.now();
  let completed = 0;
  let success = 0;
  let rateLimited = 0;
  let otherErrors = 0;

  const queue = Array.from({ length: total });
  
  const worker = async () => {
    while (queue.length > 0) {
      queue.pop();
      const status = await makeRequest(path);
      completed++;
      if (status === 200) {
        success++;
      } else if (status === 429) {
        rateLimited++;
      } else {
        otherErrors++;
      }
    }
  };

  // Spawn parallel virtual users
  const workers = Array.from({ length: concurrency }, worker);
  await Promise.all(workers);

  const duration = (Date.now() - start) / 1000;
  const rps = (completed / duration).toFixed(1);

  console.log(`Results:`);
  console.log(`  Duration: ${duration.toFixed(2)}s`);
  console.log(`  Requests/sec (RPS): ${rps}`);
  console.log(`  Success (200 OK): ${success}`);
  console.log(`  Rate Limited (429): ${rateLimited}`);
  console.log(`  Other Errors: ${otherErrors}`);
}

async function runBenchmarks() {
  try {
    // Test 1: Raw Express performance (No Rate Limiting)
    await runTest(
      "Raw Express Concurrency (No Rate Limits)",
      "/api/health",
      50,  // 50 concurrent users
      1000 // 1000 total requests
    );

    // Test 2: Rate Limited Endpoint (Testing 100-request window limit)
    await runTest(
      "Rate Limited Endpoint (Simulating 150 requests from single IP)",
      "/api/rate-limited-endpoint",
      25,  // 25 concurrent users
      150  // 150 requests (should hit 429 after 100 requests)
    );

  } catch (err) {
    console.error(err);
  } finally {
    console.log("\n[Benchmark Server] Shutting down.");
    server.close();
  }
}
