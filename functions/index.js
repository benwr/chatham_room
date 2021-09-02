const functions = require("firebase-functions");
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
