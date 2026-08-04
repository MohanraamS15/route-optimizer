import pino from "pino";
import fs from "fs";
import path from "path";

// Ensure logs directory exists inside backend
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const isDev = process.env.NODE_ENV !== "production";

const transport = pino.transport({
  targets: [
    ...(isDev
      ? [
          {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "yyyy-mm-dd HH:MM:ss.l",
              ignore: "pid,hostname",
            },
          },
        ]
      : []),
    {
      target: "pino/file",
      options: {
        destination: path.join(logsDir, "app.log"),
        mkdir: true,
      },
    },
  ],
});

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || "info",
  },
  transport
);

export default logger;
