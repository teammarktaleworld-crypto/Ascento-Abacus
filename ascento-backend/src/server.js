require('dotenv').config(); // ✅ Must be the very first line

const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { startReminderJob } = require('./services/reminder.service');

const PORT = Number(process.env.PORT) || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/school_erp';

async function start() {
  await connectDB(MONGO_URI);
  startReminderJob();

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

start().catch((error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});