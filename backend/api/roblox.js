const fetch = require('node-fetch');

// ✅ Simple cache fi RAM
const cache = {};

module.exports = async (req, res) => {
  const username = (req.query.username || '').toLowerCase();

  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }

  // ✅ Check cache
  if (cache[username]) {
    console.log('🧠 Using cached data');
    return res.status(200).json(cache[username]);
  }

  try {
    await new Promise(resolve => setTimeout(resolve, 500)); // delay bach maybanch spam

    // ✅ Try exact match
    const exactRes = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: true })
    });
    const exactData = await exactRes.json();

    let user = exactData.data && exactData.data.length > 0 ? exactData.data[0] : null;

    // ✅ Fallback: search
    if (!user) {
      const searchRes = await fetch(`https://users.roblox.com/v1/users/search?keyword=${username}&limit=10`);
      const searchData = await searchRes.json();

      if (searchData.data && searchData.data.length > 0) {
        user = searchData.data.find(
          u => u.name.toLowerCase() === username || u.displayName.toLowerCase() === username
        ) || searchData.data[0]; // First result
      }
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ Get avatar
    const avatarRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=true`);
    const avatarData = await avatarRes.json();
    const avatarUrl = avatarData.data[0]?.imageUrl;

    const result = {
      username: user.name,
      userName: user.displayName,
      avatar: avatarUrl
    };

    // ✅ Save in cache
    cache[username] = result;

    return res.status(200).json(result);

  } catch (err) {
    console.error('❌ Error:', err);
    return res.status(500).json({ message: 'Failed to fetch data from Roblox' });
  }
};
