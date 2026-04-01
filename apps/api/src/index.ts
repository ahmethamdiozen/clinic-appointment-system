import './config/env'; // validate env first
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import routes from './routes';
import { errorHandler } from './middleware/error';
import { startReminderJob } from './services/reminder.service';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));

// Twilio webhook needs raw body for XML responses; parse JSON for everything else
app.use('/api/webhooks/twilio', express.urlencoded({ extended: false }));
app.use(express.json());

app.use('/api', routes);

app.get('/health', (_req, res) => res.json({ status: 'ok', env: env.NODE_ENV }));

app.use(errorHandler);

const port = env.PORT;
app.listen(port, () => {
  console.log(`DentaBook API running on port ${port} (${env.NODE_ENV})`);
  startReminderJob();
});
