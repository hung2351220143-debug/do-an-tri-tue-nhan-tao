/**
 * chatHandler.js - SOCKET.IO REAL-TIME CHAT
 * Xu ly: khach <-> nhan vien chat realtime
 * Events: join_chat, send_message, typing, read_message, staff_join
 */
const db  = require('../config/database');
const jwt = require('jsonwebtoken');
const { addStaff, removeStaff, isOnline, onlineUserIds } = require('./onlineStaff');
const BI_MAT_JWT = process.env.JWT_SECRET || 'bi_mat_mac_dinh';

// Map socketId -> { userId, role, chatId }
const onlineUsers  = new Map();
// Map chatId -> Set of socketIds
const chatRooms    = new Map();

function initSocket(io) {

  // Middleware xac thuc token (optional)
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, BI_MAT_JWT);
        socket.userId = decoded.userId;
        socket.role   = decoded.role;
      } catch { /* khach chua dang nhap */ }
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`[SOCKET] Connected: ${socket.id} (userId=${socket.userId||'guest'})`);

    // ── Khach/User tham gia chat ──
    socket.on('join_chat', async ({ chatId, guestName, guestEmail, staffId }) => {
      try {
        let chat;
        if (chatId) {
          // Tham gia cuoc hoi thoai cu
          const [rows] = await db.execute('SELECT * FROM staff_chats WHERE id=?', [chatId]);
          chat = rows[0];
        }
        if (!chat) {
          // Khach chon nhan vien cu the VA nhan vien do dang online → gan luon
          const pickedStaff = staffId && isOnline(staffId) ? Number(staffId) : null;

          if (pickedStaff) {
            const [res] = await db.execute(
              `INSERT INTO staff_chats (user_id, staff_id, guest_name, guest_email, status)
               VALUES (?, ?, ?, ?, 'active')`,
              [socket.userId || null, pickedStaff, guestName || 'Khách', guestEmail || null]
            );
            chat = { id: res.insertId, status: 'active', staff_id: pickedStaff };

            const staffName = await getUsername(pickedStaff);
            await db.execute(
              `INSERT INTO staff_messages (chat_id, sender_type, message)
               VALUES (?, 'system', ?)`,
              [chat.id, `Khách đã chọn nhân viên ${staffName}`]
            );

            // Thong bao cho nhan vien duoc chon qua room rieng user_<staffId>
            io.to(`user_${pickedStaff}`).emit('new_chat', {
              chatId: chat.id,
              guestName: guestName || 'Khách',
              guestEmail,
              status: 'active',
              createdAt: new Date()
            });
          } else {
            // Khong chon nhan vien hoac nhan vien khong online → cho trong hang doi
            const [res] = await db.execute(
              `INSERT INTO staff_chats (user_id, guest_name, guest_email, status)
               VALUES (?, ?, ?, 'waiting')`,
              [socket.userId || null, guestName || 'Khách', guestEmail || null]
            );
            chat = { id: res.insertId, status: 'waiting' };

            // Gui system message
            await db.execute(
              `INSERT INTO staff_messages (chat_id, sender_type, message)
               VALUES (?, 'system', ?)`,
              [chat.id, `${guestName || 'Khách'} đã bắt đầu cuộc trò chuyện`]
            );

            // Thong bao cho tat ca staff online
            io.to('staff_room').emit('new_chat', {
              chatId: chat.id,
              guestName: guestName || 'Khách',
              guestEmail,
              createdAt: new Date()
            });
          }
        }

        socket.chatId = chat.id;
        socket.join(`chat_${chat.id}`);
        onlineUsers.set(socket.id, { userId: socket.userId, role: socket.role, chatId: chat.id });

        // Lay lich su tin nhan
        const [messages] = await db.execute(
          `SELECT m.*, u.username, u.avatar, u.full_name
           FROM staff_messages m
           LEFT JOIN users u ON m.sender_id = u.id
           WHERE m.chat_id = ?
           ORDER BY m.created_at ASC LIMIT 100`,
          [chat.id]
        );

        socket.emit('chat_joined', { chatId: chat.id, messages, status: chat.status });

      } catch (e) {
        console.error('[SOCKET join_chat]', e.message);
        socket.emit('error', { message: 'Không thể tham gia chat' });
      }
    });

    // ── Staff tham gia room rieng de nhan thong bao ──
    socket.on('staff_connect', () => {
      if (socket.role === 'staff' || socket.role === 'admin') {
        socket.join('staff_room');
        if (socket.userId) {
          addStaff(socket.userId, socket.id);
          socket.join(`user_${socket.userId}`);
        }
        console.log(`[SOCKET] Staff online: ${socket.id} (userId=${socket.userId})`);
        // Broadcast so luong nhan vien online cho tat ca client (bao gom user)
        io.emit('staff_online_count', onlineUserIds().length);
      }
    });

    // ── Staff nhan cuoc hoi thoai ──
    socket.on('staff_join_chat', async ({ chatId }) => {
      try {
        if (socket.role !== 'staff' && socket.role !== 'admin') return;

        await db.execute(
          `UPDATE staff_chats SET staff_id=?, status='active' WHERE id=? AND status='waiting'`,
          [socket.userId, chatId]
        );

        socket.chatId = chatId;
        socket.join(`chat_${chatId}`);

        // Tin nhan he thong
        const staffName = await getUsername(socket.userId);
        const [res] = await db.execute(
          `INSERT INTO staff_messages (chat_id, sender_id, sender_type, message)
           VALUES (?, ?, 'system', ?)`,
          [chatId, socket.userId, `Nhân viên ${staffName} đã tham gia`]
        );

        io.to(`chat_${chatId}`).emit('new_message', {
          id: res.insertId, chatId, senderType: 'system',
          message: `Nhân viên ${staffName} đã tham gia`,
          createdAt: new Date()
        });

        io.to(`chat_${chatId}`).emit('chat_status_changed', { chatId, status: 'active', staffName });

      } catch (e) {
        console.error('[SOCKET staff_join_chat]', e.message);
      }
    });

    // ── Gui tin nhan ──
    socket.on('send_message', async ({ chatId, message, fileUrl, fileName, fileType }) => {
      try {
        if (!chatId || (!message?.trim() && !fileUrl)) return;

        const senderType = socket.role === 'staff' || socket.role === 'admin' ? 'staff' : 'user';

        const [res] = await db.execute(
          `INSERT INTO staff_messages (chat_id, sender_id, sender_type, message, file_url, file_name, file_type)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [chatId, socket.userId || null, senderType, message?.trim() || null, fileUrl || null, fileName || null, fileType || null]
        );

        // Cap nhat last message trong cuoc hoi thoai
        await db.execute(
          `UPDATE staff_chats SET last_message=?, last_msg_at=NOW() WHERE id=?`,
          [message?.trim() || (fileName ? `📎 ${fileName}` : ''), chatId]
        );

        // Lay thong tin sender
        let senderInfo = { username: 'Khách', avatar: null };
        if (socket.userId) {
          const [rows] = await db.execute('SELECT username, avatar, full_name FROM users WHERE id=?', [socket.userId]);
          if (rows[0]) senderInfo = rows[0];
        }

        const msgData = {
          id: res.insertId, chatId,
          senderId: socket.userId || null,
          senderType,
          username: senderInfo.full_name || senderInfo.username,
          avatar:   senderInfo.avatar,
          message:  message?.trim() || null,
          fileUrl, fileName, fileType,
          createdAt: new Date()
        };

        // Gui cho tat ca trong room
        io.to(`chat_${chatId}`).emit('new_message', msgData);
        // Thong bao count cho staff
        io.to('staff_room').emit('chat_updated', { chatId, lastMessage: msgData });

      } catch (e) {
        console.error('[SOCKET send_message]', e.message);
      }
    });

    // ── Typing indicator ──
    socket.on('typing', ({ chatId, isTyping }) => {
      socket.to(`chat_${chatId}`).emit('user_typing', {
        socketId: socket.id,
        userId:   socket.userId,
        role:     socket.role || 'user',
        isTyping
      });
    });

    // ── Danh dau da doc ──
    socket.on('mark_read', async ({ chatId }) => {
      try {
        const senderType = socket.role === 'staff' || socket.role === 'admin' ? 'user' : 'staff';
        await db.execute(
          `UPDATE staff_messages SET is_read=1 WHERE chat_id=? AND sender_type=? AND is_read=0`,
          [chatId, senderType]
        );
        io.to(`chat_${chatId}`).emit('messages_read', { chatId, by: socket.role || 'user' });
      } catch {}
    });

    // ── Dong cuoc hoi thoai ──
    socket.on('close_chat', async ({ chatId }) => {
      try {
        if (socket.role !== 'staff' && socket.role !== 'admin') return;
        await db.execute(`UPDATE staff_chats SET status='closed' WHERE id=?`, [chatId]);
        await db.execute(
          `INSERT INTO staff_messages (chat_id, sender_type, message) VALUES (?, 'system', 'Cuộc trò chuyện đã kết thúc')`,
          [chatId]
        );
        io.to(`chat_${chatId}`).emit('chat_closed', { chatId });
        io.to('staff_room').emit('chat_updated', { chatId, status: 'closed' });
      } catch {}
    });

    // ── Disconnect ──
    socket.on('disconnect', () => {
      onlineUsers.delete(socket.id);
      if (socket.chatId) {
        socket.to(`chat_${socket.chatId}`).emit('user_offline', {
          socketId: socket.id, userId: socket.userId
        });
      }
      if (socket.role === 'staff' || socket.role === 'admin') {
        if (socket.userId) removeStaff(socket.userId, socket.id);
        io.emit('staff_online_count', onlineUserIds().length);
      }
      console.log(`[SOCKET] Disconnected: ${socket.id}`);
    });
  });
}

async function getUsername(userId) {
  if (!userId) return 'Nhân viên';
  try {
    const [rows] = await db.execute('SELECT full_name, username FROM users WHERE id=?', [userId]);
    return rows[0]?.full_name || rows[0]?.username || 'Nhân viên';
  } catch { return 'Nhân viên'; }
}

function getOnlineStaffCount(io) {
  const room = io.sockets.adapter.rooms.get('staff_room');
  return room ? room.size : 0;
}

module.exports = { initSocket };
