import * as firebaseAdmin from 'firebase-admin';

import SERVICE_ACCOUNT from '../../constants/firebase-credentials';

const serviceAccount: firebaseAdmin.ServiceAccount = {
  projectId: SERVICE_ACCOUNT.project_id,
  clientEmail: SERVICE_ACCOUNT.client_email,
  privateKey: SERVICE_ACCOUNT.private_key,
};

const firebase = firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
});

export default firebase;
