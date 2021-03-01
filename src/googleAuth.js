const fs = require('fs');
const {google} = require('googleapis');

/**
 * Generates an authorized Oauth client
 * @param {Object} credentials Object with client_id, project_id, client_secret...
 * @param {array<string>} scopes The Scopes for your OauthClient
 */
async function genOAuthClient(credentials, scopes) {
  try{
    const {client_secret, client_id, redirect_uris} = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    google.options({auth: oAuth2Client});

    const token = fs.readFileSync('./token.json');
    if (token !== undefined || token !== {}) {
      oAuth2Client.setCredentials(JSON.parse(token))
    } else {
      throw new Error("Empty Token");
    }
    return Promise.resolve(oAuth2Client);
  }catch(err){
    // Token not found or empty, generate a new one
    oAuth2Client = await getAccessToken(oAuth2Client, scopes);
    return Promise.resolve(oAuth2Client)
  }
}

/**
 * Get and store new token after prompting for user authorization
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {array<string>} scopes The Scopes for your OauthClient
 */
async function getAccessToken(oAuth2Client, scopes) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('⚠️ Authorize this app by visiting this url:', authUrl);
  let question = [
    { 
      type: 'input',
      name: 'code',
      message: 'Enter the code from that page here:'
    }
  ];
  const answer = await inquirer.prompt(question)
  console.log(`🤝 Ok, your access_code is ${answer['code']}`)
  // get new token in exchange of the auth code
  const response = await oAuth2Client.getToken(answer['code'])
  // save token in oAuth2Client
  oAuth2Client.setCredentials(response.tokens)
  // save token in disk
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(response.tokens))

  return Promise.resolve(oAuth2Client)
}

module.exports = {genOAuthClient};