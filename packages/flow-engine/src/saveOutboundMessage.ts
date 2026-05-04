/**
 * @CLAUDE_CONTEXT
 * Package : packages/flow-engine
 * File    : src/saveOutboundMessage.ts
 * Role    : Persists outbound messages sent by flow-engine nodes to the messages
 *           table so they appear in the dashboard conversation thread.
 *           Called by sendText, sendTemplate, sendInteractive after a successful send.
 * Exports : saveOutboundMessage
 */
import { db, conversations, messages, eq, and } from '@lynkbot/db';

/**
 * Finds the active conversation for the buyer and inserts an outbound message row.
 * Also updates conversation.lastMessageAt so the conversation surfaces at the top of
 * the dashboard list.
 *
 * Silently no-ops if no active conversation exists — the flow may have triggered
 * before ConversationService had a chance to create one (race condition on first
 * contact).  The message will be visible next time the conversation is opened once
 * handleInbound catches up.
 */
export async function saveOutboundMessage(
  tenantId: string,
  buyerId: string,
  textContent: string | null,
  messageType: 'text' | 'template' | 'interactive' | 'image' | 'document' = 'text',
): Promise<void> {
  try {
    const conv = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.tenantId, tenantId),
        eq(conversations.buyerId, buyerId),
        eq(conversations.isActive, true),
      ),
      columns: { id: true },
    });

    if (!conv) return; // No conversation yet — skip silently

    await db
      .insert(messages)
      .values({
        conversationId: conv.id,
        tenantId,
        direction: 'outbound',
        messageType,
        textContent: textContent ?? null,
        createdAt: new Date(),
      })
      .onConflictDoNothing();

    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conv.id));
  } catch (err) {
    // Non-fatal — a missing DB row must never crash the flow execution.
    console.warn('[saveOutboundMessage] Failed to persist outbound message:', err);
  }
}
