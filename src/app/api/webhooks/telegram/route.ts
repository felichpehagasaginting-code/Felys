import { TelegramBotService } from "@/server/services/telegram-bot.service";
import { requireAdminDb } from "@/lib/firebase/auth-helpers";
import { recomputeUrgency } from "@/server/services/finance-ledger.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: {
      id: number | string;
      first_name?: string;
      username?: string;
      type: string;
    };
    text?: string;
    date: number;
  };
}

/**
 * Helper to send reply message back to Telegram
 */
async function sendTelegramMessage(chatId: string | number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("[Telegram Webhook] TELEGRAM_BOT_TOKEN not configured. Skipping sendMessage API call.");
    return;
  }

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });
  } catch (err) {
    console.error("[Telegram Webhook] Failed to send message back to Telegram:", err);
  }
}

/** POST /api/webhooks/telegram — Handle incoming updates from Telegram Bot */
export async function POST(req: Request) {
  try {
    // 1. Optional Webhook Secret verification
    const secretHeader = req.headers.get("x-telegram-bot-api-secret-token");
    const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (configuredSecret && secretHeader !== configuredSecret) {
      return Response.json({ error: "Invalid secret token" }, { status: 403 });
    }

    const body: TelegramUpdate = await req.json();
    const message = body.message;

    if (!message || !message.text) {
      return Response.json({ ok: true, ignored: "No text message" });
    }

    const chatId = String(message.chat.id);
    const text = message.text;

    // 2. Process message through NLP & Bot Service
    const botResult = TelegramBotService.processIncomingText(text, chatId);
    const uid = TelegramBotService.getUidByChatId(chatId);

    // 3. Persist to Firestore if user is paired and action was triggered
    if (uid && botResult.action) {
      try {
        const db = requireAdminDb();

        if (botResult.action === "task_added" && botResult.data) {
          const taskData = botResult.data;
          const urgencyScore = recomputeUrgency({
            deadline: taskData.deadline,
            priority: taskData.priority,
            estimatedHours: taskData.estimatedHours ?? null,
          });

          const taskRef = db.collection("users").doc(uid).collection("tasks").doc();
          await taskRef.set({
            title: taskData.title,
            courseId: taskData.courseId || "general",
            courseName: taskData.courseName || "Umum",
            courseColor: "#7C5CFA",
            deadline: taskData.deadline,
            priority: taskData.priority,
            status: "todo",
            urgencyScore,
            manualOrder: null,
            completedSubtasksCount: 0,
            totalSubtasksCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: "telegram_bot",
          });
        } else if (botResult.action === "transaction_added" && botResult.data) {
          const tx = botResult.data;
          const txRef = db.collection("users").doc(uid).collection("transactions").doc();
          await txRef.set({
            type: tx.type || "expense",
            amount: tx.amount,
            date: new Date().toISOString(),
            note: tx.merchantOrNote || tx.note || "Transaksi via Telegram",
            accountId: tx.accountId || "default",
            categoryId: tx.categoryId || "general",
            categoryName: tx.categoryName || "Umum",
            provider: tx.provider || "cash",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: "telegram_bot",
          });
        }
      } catch (firestoreErr) {
        console.error("[Telegram Webhook] Error persisting data to Firestore:", firestoreErr);
      }
    }

    // 4. Send response back to Telegram chat
    await sendTelegramMessage(chatId, botResult.replyText);

    return Response.json({
      ok: true,
      action: botResult.action,
      replyText: botResult.replyText,
    });
  } catch (err: any) {
    console.error("[Telegram Webhook Error]:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
