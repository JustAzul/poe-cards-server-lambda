import * as firebaseAdmin from 'firebase-admin';

import SERVICE_ACCOUNT from '../../constants/firebase-credentials';

const serviceAccount: firebaseAdmin.ServiceAccount = {
  clientEmail: SERVICE_ACCOUNT.client_email,
  privateKey: SERVICE_ACCOUNT.private_key,
  projectId: SERVICE_ACCOUNT.project_id,
};

const firebase = firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
});

export default firebase;
