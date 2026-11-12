/**
 * onlineStaff.js - BO THEO DOI NHAN VIEN ONLINE (chia se giua socket + REST)
 * Map<userId(Number), Set<socketId>> — mot user co the giu nhieu socket (nhieu tab)
 */
const online = new Map(); // userId(Number) -> Set<socketId>

// Luon luon chuyen userId ve Number de dong bo khoa Map
function _key(userId) {
  const n = Number(userId);
  return Number.isFinite(n) ? n : null;
}

function addStaff(userId, socketId) {
  const k = _key(userId);
  if (k === null || socketId == null) return;
  if (!online.has(k)) online.set(k, new Set());
  online.get(k).add(socketId);
}

function removeStaff(userId, socketId) {
  const k = _key(userId);
  if (k === null) return;
  const set = online.get(k);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) online.delete(k);
}

function isOnline(userId) {
  const k = _key(userId);
  if (k === null) return false;
  const set = online.get(k);
  return !!(set && set.size > 0);
}

function onlineUserIds() {
  return Array.from(online.keys());
}

module.exports = { addStaff, removeStaff, isOnline, onlineUserIds };
