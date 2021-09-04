const functions = require("firebase-functions");
const admin = require("firebase-admin");
const mailgun = require("mailgun-js")({apiKey: functions.config().mailgun.key, domain: "chathamroom.com"});

exports.sendInvitation = functions.https.onCall((data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "We do not have an auth info");
  }
  if (!context.auth.token) {
    throw new functions.https.HttpsError("unauthenticated", "We do not have a token the auth info");
  }
  if (!context.auth.token.email) {
    throw new functions.https.HttpsError("unauthenticated", "We do not have an email in the auth token");
  }
  var sendings = [];
  for (const email of data.targets) {
    const req = {
      from: "Chatham Room Staff <staff@chathamroom.com>",
      to: email,
      subject: "You have been invited to a Chatham Room",
      template: "invitation-template",
      "v:sender_email": context.auth.token.email,
      "v:invitee_email": email,
      "v:room_id": data.room_id,
      "v:room_name": data.room_name,
    };
    sendings.push(mailgun.messages().send(req, (error, body) => {
      if (error) {
        throw new functions.https.HttpsError("unknown", "An error was encountered when attempting to talk to Mailgun: " + body);
      }
      return {};
    }));
  }
  return Promise.allSettled(sendings);
});

exports.findDeadRooms = functions.pubsub.schedule("every 6 hours").onRun((context) => {
  var serviceAccount = {
    "type": "service_account",
    "project_id": "chatham-room",
    "private_key_id": functions.config().service_account.id,
    "private_key": functions.config().service_account.key,
    "client_email": "firebase-adminsdk-n9ohd@chatham-room.iam.gserviceaccount.com",
    "client_id": "114873566813479668665",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-n9ohd%40chatham-room.iam.gserviceaccount.com"
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://chatham-room-default-rtdb.firebaseio.com/",
  });

  var db = admin.database();
  var ref = db.ref("");
});
