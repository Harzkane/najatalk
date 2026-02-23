#!/usr/bin/env node
// npm run ops:retention:report

import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error(
    "Missing MONGO_URI. Add it to backend/.env before running retention report.",
  );
  process.exit(1);
}

const parseDays = (value, fallback) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const policy = [
  {
    collection: "adminactionlogs",
    dateField: "createdAt",
    retentionDays: parseDays(process.env.RETENTION_ADMIN_ACTION_DAYS, 365),
    archiveCollection: "adminactionlogs_archive",
  },
  {
    collection: "walletledgers",
    dateField: "createdAt",
    retentionDays: parseDays(process.env.RETENTION_WALLET_LEDGER_DAYS, 3650),
    archiveCollection: "walletledgers_archive",
  },
  {
    collection: "transactions",
    dateField: "createdAt",
    retentionDays: parseDays(process.env.RETENTION_TRANSACTION_DAYS, 3650),
    archiveCollection: "transactions_archive",
  },
  {
    collection: "premiumpayments",
    dateField: "createdAt",
    retentionDays: parseDays(process.env.RETENTION_PREMIUM_PAYMENT_DAYS, 1825),
    archiveCollection: "premiumpayments_archive",
  },
  {
    collection: "reports",
    dateField: "createdAt",
    retentionDays: parseDays(process.env.RETENTION_REPORT_DAYS, 730),
    archiveCollection: "reports_archive",
  },
  {
    collection: "contestsubmissions",
    dateField: "createdAt",
    retentionDays: parseDays(
      process.env.RETENTION_CONTEST_SUBMISSION_DAYS,
      730,
    ),
    archiveCollection: "contestsubmissions_archive",
  },
];

const extractDbName = (mongoUri) => {
  try {
    const parsed = new URL(mongoUri);
    const dbName = parsed.pathname?.replace(/^\//, "") || "najatalk";
    return dbName;
  } catch {
    return "najatalk";
  }
};

const dbName = process.env.MONGO_DB_NAME || extractDbName(uri);
const outputPath = process.env.RETENTION_REPORT_JSON || "";

const run = async () => {
  const client = new MongoClient(uri, {
    maxPoolSize: 5,
    minPoolSize: 0,
  });

  try {
    await client.connect();
    const db = client.db(dbName);
    const existingCollections = new Set(
      (await db.listCollections({}, { nameOnly: true }).toArray()).map(
        (c) => c.name,
      ),
    );

    const rows = [];
    for (const item of policy) {
      if (!existingCollections.has(item.collection)) {
        rows.push({
          collection: item.collection,
          archiveCollection: item.archiveCollection,
          retentionDays: item.retentionDays,
          exists: false,
          total: 0,
          eligibleForArchive: 0,
          oldest: null,
          newest: null,
        });
        continue;
      }

      const cutoff = new Date(
        Date.now() - item.retentionDays * 24 * 60 * 60 * 1000,
      );
      const coll = db.collection(item.collection);

      // eslint-disable-next-line no-await-in-loop
      const [total, eligibleForArchive, oldestDoc, newestDoc] =
        await Promise.all([
          coll.countDocuments({}),
          coll.countDocuments({ [item.dateField]: { $lt: cutoff } }),
          coll
            .find({}, { projection: { [item.dateField]: 1 } })
            .sort({ [item.dateField]: 1 })
            .limit(1)
            .next(),
          coll
            .find({}, { projection: { [item.dateField]: 1 } })
            .sort({ [item.dateField]: -1 })
            .limit(1)
            .next(),
        ]);

      rows.push({
        collection: item.collection,
        archiveCollection: item.archiveCollection,
        retentionDays: item.retentionDays,
        exists: true,
        total,
        eligibleForArchive,
        oldest: oldestDoc?.[item.dateField]
          ? new Date(oldestDoc[item.dateField]).toISOString()
          : null,
        newest: newestDoc?.[item.dateField]
          ? new Date(newestDoc[item.dateField]).toISOString()
          : null,
      });
    }

    const report = {
      ts: new Date().toISOString(),
      dbName,
      rows,
    };

    console.log("Data Retention Report");
    console.log(`Database: ${dbName}`);
    console.log("-");
    for (const row of rows) {
      console.log(
        `${row.collection} | exists=${row.exists} | retentionDays=${row.retentionDays} | total=${row.total} | archiveEligible=${row.eligibleForArchive}`,
      );
    }

    if (outputPath) {
      const fullPath = path.isAbsolute(outputPath)
        ? outputPath
        : path.resolve(process.cwd(), outputPath);
      fs.writeFileSync(
        fullPath,
        `${JSON.stringify(report, null, 2)}\n`,
        "utf8",
      );
      console.log(`Saved JSON report: ${fullPath}`);
    }
  } finally {
    await client.close();
  }
};

run().catch((err) => {
  console.error(`Retention report failed: ${err?.message || err}`);
  process.exit(1);
});
