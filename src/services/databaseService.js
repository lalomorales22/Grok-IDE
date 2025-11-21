const sqlite3 = require('sqlite3').verbose();
const config = require('../config/config');
const logger = require('../utils/logger');
const { APIError } = require('../middleware/errorHandler');

class DatabaseService {
    constructor() {
        this.db = null;
    }

    /**
     * Initialize database connection and tables
     */
    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(config.database.filename, (err) => {
                if (err) {
                    logger.error('Failed to connect to database', { error: err.message });
                    reject(new APIError('Database connection failed', 500));
                } else {
                    logger.info('Connected to SQLite database', { filename: config.database.filename });
                    this._initializeTables()
                        .then(resolve)
                        .catch(reject);
                }
            });

            if (config.database.verbose) {
                this.db.on('trace', (sql) => {
                    logger.debug('SQL query executed', { sql });
                });
            }
        });
    }

    /**
     * Initialize database tables
     */
    async _initializeTables() {
        const createSessionsTable = `
            CREATE TABLE IF NOT EXISTS chat_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const createMessagesTable = `
            CREATE TABLE IF NOT EXISTS chat_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                user_message TEXT NOT NULL,
                ai_response TEXT NOT NULL,
                has_images BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES chat_sessions (id)
            )
        `;

        try {
            await this.run(createSessionsTable);
            logger.info('Chat sessions table ready');

            await this.run(createMessagesTable);
            logger.info('Chat messages table ready');
        } catch (error) {
            logger.error('Failed to initialize tables', { error: error.message });
            throw error;
        }
    }

    /**
     * Execute a query that doesn't return rows
     */
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) {
                    logger.error('Database run error', { sql, error: err.message });
                    reject(new APIError('Database operation failed', 500));
                } else {
                    resolve({ lastID: this.lastID, changes: this.changes });
                }
            });
        });
    }

    /**
     * Execute a query that returns a single row
     */
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    logger.error('Database get error', { sql, error: err.message });
                    reject(new APIError('Database query failed', 500));
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Execute a query that returns multiple rows
     */
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    logger.error('Database all error', { sql, error: err.message });
                    reject(new APIError('Database query failed', 500));
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Get all chat sessions
     */
    async getChatSessions(limit = 50) {
        const query = `
            SELECT
                cs.id,
                cs.created_at,
                cs.updated_at,
                COUNT(cm.id) as message_count,
                (SELECT cm2.user_message
                 FROM chat_messages cm2
                 WHERE cm2.session_id = cs.id
                 ORDER BY cm2.created_at ASC
                 LIMIT 1) as first_message
            FROM chat_sessions cs
            LEFT JOIN chat_messages cm ON cs.id = cm.session_id
            GROUP BY cs.id
            ORDER BY cs.updated_at DESC
            LIMIT ?
        `;

        try {
            const sessions = await this.all(query, [limit]);
            return sessions;
        } catch (error) {
            logger.error('Failed to fetch chat sessions', { error: error.message });
            throw error;
        }
    }

    /**
     * Get a specific chat session with messages
     */
    async getChatSession(sessionId) {
        try {
            const session = await this.get(
                'SELECT * FROM chat_sessions WHERE id = ?',
                [sessionId]
            );

            if (!session) {
                throw new APIError('Session not found', 404);
            }

            const messages = await this.all(
                'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
                [sessionId]
            );

            return {
                ...session,
                messages
            };
        } catch (error) {
            logger.error('Failed to fetch chat session', { sessionId, error: error.message });
            throw error;
        }
    }

    /**
     * Create a new chat session
     */
    async createChatSession() {
        try {
            const result = await this.run('INSERT INTO chat_sessions DEFAULT VALUES');
            logger.info('Chat session created', { sessionId: result.lastID });
            return result.lastID;
        } catch (error) {
            logger.error('Failed to create chat session', { error: error.message });
            throw error;
        }
    }

    /**
     * Save a chat message
     */
    async saveChatMessage({ sessionId, userMessage, aiResponse, hasImages = false }) {
        try {
            let finalSessionId = sessionId;

            // Create new session if not provided
            if (!finalSessionId) {
                finalSessionId = await this.createChatSession();
            }

            // Insert message
            const result = await this.run(
                `INSERT INTO chat_messages (session_id, user_message, ai_response, has_images)
                 VALUES (?, ?, ?, ?)`,
                [finalSessionId, userMessage, aiResponse, hasImages ? 1 : 0]
            );

            // Update session timestamp
            await this.run(
                'UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [finalSessionId]
            );

            logger.info('Chat message saved', {
                messageId: result.lastID,
                sessionId: finalSessionId
            });

            return {
                messageId: result.lastID,
                sessionId: finalSessionId
            };
        } catch (error) {
            logger.error('Failed to save chat message', { error: error.message });
            throw error;
        }
    }

    /**
     * Delete a chat session and its messages
     */
    async deleteChatSession(sessionId) {
        try {
            // Delete messages first (foreign key constraint)
            await this.run('DELETE FROM chat_messages WHERE session_id = ?', [sessionId]);

            // Delete session
            const result = await this.run('DELETE FROM chat_sessions WHERE id = ?', [sessionId]);

            if (result.changes === 0) {
                throw new APIError('Session not found', 404);
            }

            logger.info('Chat session deleted', { sessionId });
            return true;
        } catch (error) {
            logger.error('Failed to delete chat session', { sessionId, error: error.message });
            throw error;
        }
    }

    /**
     * Close database connection
     */
    close() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve();
                return;
            }

            this.db.close((err) => {
                if (err) {
                    logger.error('Failed to close database', { error: err.message });
                    reject(err);
                } else {
                    logger.info('Database connection closed');
                    resolve();
                }
            });
        });
    }
}

// Export singleton instance
const databaseService = new DatabaseService();
module.exports = databaseService;
