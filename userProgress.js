const userProgress = {}; // This would ideally be stored in a database

function getUserProgress(userId) {
  if (!userProgress[userId]) {
    userProgress[userId] = { correct: 0, incorrect: 0 };
  }
  return userProgress[userId];
}

function updateUserProgress(userId, isCorrect) {
  if (!userProgress[userId]) {
    userProgress[userId] = { correct: 0, incorrect: 0 };
  }
  if (isCorrect) {
    userProgress[userId].correct += 1;
  } else {
    userProgress[userId].incorrect += 1;
  }
}

function getLeaderboard() {
  const leaderboard = Object.entries(userProgress)
    .map(([userId, progress]) => ({ userId, ...progress }))
    .sort((a, b) => b.correct - a.correct)
    .slice(0, 10);
  return leaderboard;
}

module.exports = { getUserProgress, updateUserProgress, getLeaderboard };
