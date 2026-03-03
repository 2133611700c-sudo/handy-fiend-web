/**
 * Temporary FB diagnostic endpoint — DELETE after use
 * GET /api/fb-diag
 */
async function handler(req, res) {
  const pageToken = process.env.FB_PAGE_ACCESS_TOKEN || '';
  const pageId = '1039840475873352';
  const appId = '26599892572930046';
  const v = 'v19.0';

  if (!pageToken) {
    return res.status(500).json({ error: 'No FB_PAGE_ACCESS_TOKEN' });
  }

  const results = {};

  // 1. Check page info + subscription
  try {
    const r = await fetch(`https://graph.facebook.com/${v}/${pageId}/subscribed_apps?access_token=${pageToken}`);
    results.subscribed_apps = await r.json();
  } catch (e) {
    results.subscribed_apps_error = e.message;
  }

  // 2. Check page token validity (introspect)
  try {
    const r = await fetch(`https://graph.facebook.com/${v}/me?fields=id,name&access_token=${pageToken}`);
    results.page_me = await r.json();
  } catch (e) {
    results.page_me_error = e.message;
  }

  // 3. Check app info
  try {
    const r = await fetch(`https://graph.facebook.com/${v}/${appId}?fields=name,status,mode&access_token=${pageToken}`);
    results.app_info = await r.json();
  } catch (e) {
    results.app_info_error = e.message;
  }

  // 4. Check messenger features on app
  try {
    const r = await fetch(`https://graph.facebook.com/${v}/${appId}/features?access_token=${pageToken}`);
    results.app_features = await r.json();
  } catch (e) {
    results.app_features_error = e.message;
  }

  return res.status(200).json(results);
}

module.exports = handler;
