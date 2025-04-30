require('dotenv').config();

module.exports = {
  limbleApiHostname: 'api.limblecmms.com',
  limbleApiBasePath: '/v2',
  limbleClientId: process.env.LIMBLE_CLIENT_ID,
  limbleClientSecret: process.env.LIMBLE_CLIENT_SECRET,
};