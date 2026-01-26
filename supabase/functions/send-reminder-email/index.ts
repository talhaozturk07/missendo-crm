import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderEmailRequest {
  reminder_id?: string;
  check_pending?: boolean;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const smtpHost = Deno.env.get("SMTP_HOST")!;
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER")!;
    const smtpPass = Deno.env.get("SMTP_PASS")!;
    const fromEmail = Deno.env.get("SMTP_FROM_EMAIL")!;
    const fromName = Deno.env.get("SMTP_FROM_NAME") || "Miss Endo CRM";

    const { reminder_id, check_pending }: ReminderEmailRequest = await req.json();

    let remindersToProcess: any[] = [];

    if (check_pending) {
      // Get all pending reminders that are due
      const now = new Date().toISOString();
      const { data: pendingReminders, error: fetchError } = await supabase
        .from("reminders")
        .select(`
          *,
          patient:patients(first_name, last_name, phone, email),
          lead:leads(first_name, last_name, phone, email),
          creator:profiles!reminders_created_by_fkey(first_name, last_name, email)
        `)
        .eq("status", "pending")
        .lte("reminder_date", now);

      if (fetchError) {
        console.error("Error fetching pending reminders:", fetchError);
        throw fetchError;
      }

      remindersToProcess = pendingReminders || [];
      console.log(`Found ${remindersToProcess.length} pending reminders to process`);
    } else if (reminder_id) {
      // Get specific reminder
      const { data: reminder, error: fetchError } = await supabase
        .from("reminders")
        .select(`
          *,
          patient:patients(first_name, last_name, phone, email),
          lead:leads(first_name, last_name, phone, email),
          creator:profiles!reminders_created_by_fkey(first_name, last_name, email)
        `)
        .eq("id", reminder_id)
        .single();

      if (fetchError) {
        console.error("Error fetching reminder:", fetchError);
        throw fetchError;
      }

      remindersToProcess = reminder ? [reminder] : [];
    }

    if (remindersToProcess.length === 0) {
      return new Response(
        JSON.stringify({ message: "No reminders to process", count: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: smtpPort === 465,
        auth: {
          username: smtpUser,
          password: smtpPass,
        },
      },
    });

    let successCount = 0;
    let errorCount = 0;

    for (const reminder of remindersToProcess) {
      try {
        const targetName = reminder.patient 
          ? `${reminder.patient.first_name} ${reminder.patient.last_name}`
          : reminder.lead 
            ? `${reminder.lead.first_name} ${reminder.lead.last_name}`
            : "Unknown";

        const targetType = reminder.patient ? "Patient" : "Lead";
        const targetPhone = reminder.patient?.phone || reminder.lead?.phone || "N/A";
        const creatorEmail = reminder.creator?.email;

        if (!creatorEmail) {
          console.error(`No email found for reminder creator: ${reminder.id}`);
          errorCount++;
          continue;
        }

        const reminderDate = new Date(reminder.reminder_date).toLocaleString("tr-TR", {
          dateStyle: "long",
          timeStyle: "short",
        });

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #6366f1; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
              .footer { background: #f3f4f6; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #6b7280; }
              .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
              .badge-patient { background: #dbeafe; color: #1d4ed8; }
              .badge-lead { background: #fef3c7; color: #b45309; }
              .info-row { margin: 10px 0; padding: 10px; background: white; border-radius: 6px; }
              .label { font-weight: 600; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🔔 Hatırlatma</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">${reminder.title}</p>
              </div>
              <div class="content">
                <div class="info-row">
                  <span class="label">Kişi:</span> 
                  <strong>${targetName}</strong>
                  <span class="badge ${targetType === 'Patient' ? 'badge-patient' : 'badge-lead'}">${targetType}</span>
                </div>
                <div class="info-row">
                  <span class="label">Telefon:</span> ${targetPhone}
                </div>
                <div class="info-row">
                  <span class="label">Hatırlatma Tarihi:</span> ${reminderDate}
                </div>
                <div class="info-row">
                  <span class="label">Tip:</span> ${getReminderTypeLabel(reminder.reminder_type)}
                </div>
                ${reminder.notes ? `
                <div class="info-row">
                  <span class="label">Notlar:</span><br>
                  <p style="margin: 5px 0 0 0;">${reminder.notes}</p>
                </div>
                ` : ''}
              </div>
              <div class="footer">
                Miss Endo CRM - Hatırlatma Sistemi
              </div>
            </div>
          </body>
          </html>
        `;

        await client.send({
          from: `${fromName} <${fromEmail}>`,
          to: creatorEmail,
          subject: `🔔 Hatırlatma: ${reminder.title} - ${targetName}`,
          html: emailHtml,
        });

        // Update reminder status
        await supabase
          .from("reminders")
          .update({ 
            status: "sent", 
            email_sent_at: new Date().toISOString() 
          })
          .eq("id", reminder.id);

        console.log(`Reminder email sent successfully for: ${reminder.id}`);
        successCount++;
      } catch (emailError) {
        console.error(`Failed to send email for reminder ${reminder.id}:`, emailError);
        errorCount++;
      }
    }

    await client.close();

    return new Response(
      JSON.stringify({ 
        message: "Reminders processed",
        success: successCount,
        errors: errorCount,
        total: remindersToProcess.length
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-reminder-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getReminderTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    call_back: "Geri Ara",
    follow_up: "Takip",
    appointment: "Randevu",
    unreachable: "Ulaşılamadı",
    custom: "Özel",
  };
  return labels[type] || type;
}