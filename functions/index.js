const functions = require("firebase-functions");
const axios = require("axios");

exports.helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

exports.sendInvitation = functions.https.onCall((data, context) => {
  const api_key = functions.config().mailgun.key;
  // if (!context.auth.email) {
  //   throw new functions.https.HttpsError("unauthorized", "Email not in auth token");
  // }
  return axios.post("https://api:" + api_key + "@api.mailgun.net/v3/chathamroom.com/messages", {
    from: "staff@chathamroom.com",
    to: data.invitee || "",
    subject: "You've been invited to a Chatham Room",
    template: "invitation-template",
    "v:sender_email": context.auth.email || "",
    "v:invitee_email": data.invitee || "",
    "v:room_id": data.room_id || "",
    "v:room_name": data.room_name || "",
  }).then(res => {
    if (res.status !== 200) {
      throw new functions.https.HttpsError("unknown", "Mailgun gave a non-200 response code");
    } else {
      return {}
    }
  }).catch(err => {
      throw new functions.https.HttpsError("unknown", "An error was encountered when attempting to talk to Mailgun");
  });
});
