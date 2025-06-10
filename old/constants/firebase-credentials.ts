import * as dotenv from 'dotenv';

dotenv.config();

export default {
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  private_key: process.env.FIREBASE_PRIVATE_KEY,
  project_id: process.env.FIREBASE_PROJECT_ID,
};
