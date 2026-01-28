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

// Advance notification intervals in days
const ADVANCE_NOTIFICATION_DAYS = [7, 3, 1]; // 1 week, 3 days, 1 day before

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
    let advanceReminders: any[] = [];

    if (check_pending) {
      const now = new Date();
      const nowIso = now.toISOString();
      
      // Get all pending reminders that are due NOW
      const { data: pendingReminders, error: fetchError } = await supabase
        .from("reminders")
        .select(`
          *,
          patient:patients(first_name, last_name, phone, email),
          lead:leads(first_name, last_name, phone, email),
          creator:profiles!reminders_created_by_fkey(first_name, last_name, email)
        `)
        .eq("status", "pending")
        .lte("reminder_date", nowIso);

      if (fetchError) {
        console.error("Error fetching pending reminders:", fetchError);
        throw fetchError;
      }

      remindersToProcess = pendingReminders || [];
      console.log(`Found ${remindersToProcess.length} pending reminders due now`);

      // Get reminders for advance notifications (1 week, 3 days, 1 day before)
      for (const daysAhead of ADVANCE_NOTIFICATION_DAYS) {
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + daysAhead);
        
        // Check for reminders on this future date (within a 15-minute window to match cron interval)
        const startWindow = new Date(targetDate);
        startWindow.setMinutes(startWindow.getMinutes() - 7);
        
        const endWindow = new Date(targetDate);
        endWindow.setMinutes(endWindow.getMinutes() + 8);

        const { data: futureReminders, error: futureError } = await supabase
          .from("reminders")
          .select(`
            *,
            patient:patients(first_name, last_name, phone, email),
            lead:leads(first_name, last_name, phone, email),
            creator:profiles!reminders_created_by_fkey(first_name, last_name, email)
          `)
          .eq("status", "pending")
          .gte("reminder_date", startWindow.toISOString())
          .lte("reminder_date", endWindow.toISOString());

        if (futureError) {
          console.error(`Error fetching ${daysAhead}-day advance reminders:`, futureError);
          continue;
        }

        if (futureReminders && futureReminders.length > 0) {
          // Mark these as advance notifications
          const advanceNotifications = futureReminders.map(r => ({
            ...r,
            _advanceDays: daysAhead,
            _isAdvanceNotification: true
          }));
          advanceReminders.push(...advanceNotifications);
          console.log(`Found ${futureReminders.length} reminders for ${daysAhead}-day advance notification`);
        }
      }
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

    const allRemindersToSend = [...remindersToProcess, ...advanceReminders];

    if (allRemindersToSend.length === 0) {
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

    for (const reminder of allRemindersToSend) {
      try {
        const isAdvanceNotification = reminder._isAdvanceNotification || false;
        const advanceDays = reminder._advanceDays || 0;
        
        const targetName = reminder.patient 
          ? `${reminder.patient.first_name} ${reminder.patient.last_name}`
          : reminder.lead 
            ? `${reminder.lead.first_name} ${reminder.lead.last_name}`
            : "Unknown";

        const targetType = reminder.patient ? "Patient" : "Lead";
        const targetPhone = reminder.patient?.phone || reminder.lead?.phone || "N/A";
        
        // Determine recipients based on notify_all_admins flag
        let recipientEmails: string[] = [];
        
        if (reminder.notify_all_admins) {
          // Get all super admin emails
          const { data: superAdmins, error: adminError } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role", "super_admin");
          
          if (adminError) {
            console.error("Error fetching super admins:", adminError);
          } else if (superAdmins && superAdmins.length > 0) {
            const userIds = superAdmins.map(sa => sa.user_id);
            const { data: profiles, error: profileError } = await supabase
              .from("profiles")
              .select("email")
              .in("id", userIds);
            
            if (profileError) {
              console.error("Error fetching admin profiles:", profileError);
            } else if (profiles) {
              recipientEmails = profiles.map(p => p.email).filter(Boolean);
            }
          }
          console.log(`Sending to all super admins: ${recipientEmails.length} recipients`);
        } else {
          // Send only to creator
          const creatorEmail = reminder.creator?.email;
          if (creatorEmail) {
            recipientEmails = [creatorEmail];
          }
        }

        if (recipientEmails.length === 0) {
          console.error(`No recipients found for reminder: ${reminder.id}`);
          errorCount++;
          continue;
        }

        const reminderDate = new Date(reminder.reminder_date).toLocaleString("en-US", {
          dateStyle: "long",
          timeStyle: "short",
        });

        // Determine email subject and header based on advance notification
        let emailSubjectPrefix = "Reminder";
        let headerTitle = "Reminder";
        let urgencyBadge = "";
        
        if (isAdvanceNotification) {
          if (advanceDays === 7) {
            emailSubjectPrefix = "📅 1 Week Notice";
            headerTitle = "1 Week Advance Notice";
            urgencyBadge = '<span style="display: inline-block; margin-left: 10px; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; background-color: #dbeafe; color: #1d4ed8;">1 Week Away</span>';
          } else if (advanceDays === 3) {
            emailSubjectPrefix = "⚠️ 3 Day Notice";
            headerTitle = "3 Day Advance Notice";
            urgencyBadge = '<span style="display: inline-block; margin-left: 10px; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; background-color: #fef3c7; color: #b45309;">3 Days Away</span>';
          } else if (advanceDays === 1) {
            emailSubjectPrefix = "🔔 Tomorrow";
            headerTitle = "Tomorrow - Action Required";
            urgencyBadge = '<span style="display: inline-block; margin-left: 10px; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; background-color: #fee2e2; color: #dc2626;">Tomorrow!</span>';
          }
        }

        const emailHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
<tr>
<td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
<!-- Header with Logo -->
<tr>
<td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
<img src="https://xzcpxatfzgusrxfreeoi.supabase.co/storage/v1/object/public/email-assets/miss-endo-logo.webp?v=1" alt="Miss Endo" width="120" style="max-width: 120px; height: auto; margin-bottom: 15px;">
<h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">${headerTitle}</h1>
<p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">${reminder.title}${urgencyBadge}</p>
</td>
</tr>
<!-- Content -->
<tr>
<td style="padding: 30px;">
<table width="100%" cellpadding="0" cellspacing="0">
<!-- Person Info -->
<tr>
<td style="padding: 15px; background-color: #f9fafb; border-radius: 8px; margin-bottom: 12px;">
<p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Contact</p>
<p style="margin: 5px 0 0 0; color: #111827; font-size: 18px; font-weight: 600;">${targetName}</p>
<span style="display: inline-block; margin-top: 8px; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; ${targetType === 'Patient' ? 'background-color: #dbeafe; color: #1d4ed8;' : 'background-color: #fef3c7; color: #b45309;'}">${targetType}</span>
</td>
</tr>
<tr><td style="height: 12px;"></td></tr>
<!-- Phone -->
<tr>
<td style="padding: 15px; background-color: #f9fafb; border-radius: 8px;">
<p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Phone</p>
<p style="margin: 5px 0 0 0; color: #111827; font-size: 16px; font-weight: 500;">${targetPhone}</p>
</td>
</tr>
<tr><td style="height: 12px;"></td></tr>
<!-- Date -->
<tr>
<td style="padding: 15px; background-color: ${isAdvanceNotification && advanceDays === 1 ? '#fee2e2' : '#f9fafb'}; border-radius: 8px; ${isAdvanceNotification && advanceDays === 1 ? 'border: 2px solid #fca5a5;' : ''}">
<p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">${isAdvanceNotification ? 'Scheduled For' : 'Reminder Date'}</p>
<p style="margin: 5px 0 0 0; color: #111827; font-size: 16px; font-weight: 500;">${reminderDate}</p>
${isAdvanceNotification ? `<p style="margin: 8px 0 0 0; color: #dc2626; font-size: 14px; font-weight: 600;">${advanceDays === 1 ? 'TOMORROW!' : advanceDays + ' days from now'}</p>` : ''}
</td>
</tr>
<tr><td style="height: 12px;"></td></tr>
<!-- Type -->
<tr>
<td style="padding: 15px; background-color: #f9fafb; border-radius: 8px;">
<p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Type</p>
<p style="margin: 5px 0 0 0; color: #111827; font-size: 16px; font-weight: 500;">${getReminderTypeLabel(reminder.reminder_type)}</p>
</td>
</tr>
${reminder.notes ? `<tr><td style="height: 12px;"></td></tr>
<tr>
<td style="padding: 15px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
<p style="margin: 0; color: #92400e; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Notes</p>
<p style="margin: 5px 0 0 0; color: #78350f; font-size: 14px;">${reminder.notes}</p>
</td>
</tr>` : ''}
</table>
</td>
</tr>
<!-- Footer -->
<tr>
<td style="background-color: #1f2937; padding: 25px; text-align: center;">
<p style="margin: 0; color: #9ca3af; font-size: 12px;">Miss Endo CRM - Reminder System</p>
<p style="margin: 8px 0 0 0; color: #6b7280; font-size: 11px;">${isAdvanceNotification ? 'This is an advance notification. You will receive another reminder when it is due.' : 'This email was sent automatically.'}</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

        // Send email to all recipients
        for (const recipientEmail of recipientEmails) {
          await client.send({
            from: `${fromName} <${fromEmail}>`,
            to: recipientEmail,
            subject: `${emailSubjectPrefix}: ${reminder.title} - ${targetName}`,
            html: emailHtml,
          });
          console.log(`Email sent to: ${recipientEmail} (${isAdvanceNotification ? advanceDays + '-day advance' : 'due now'})`);
        }

        // Only update status for reminders that are due NOW (not advance notifications)
        if (!isAdvanceNotification) {
          await supabase
            .from("reminders")
            .update({ 
              status: "sent", 
              email_sent_at: new Date().toISOString() 
            })
            .eq("id", reminder.id);
        }

        console.log(`Reminder email sent successfully for: ${reminder.id} (${isAdvanceNotification ? 'advance notification' : 'due now'})`);
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
        total: allRemindersToSend.length,
        dueNow: remindersToProcess.length,
        advanceNotifications: advanceReminders.length
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
    call_back: "Call Back",
    follow_up: "Follow Up",
    appointment: "Appointment",
    unreachable: "Unreachable",
    custom: "Custom",
  };
  return labels[type] || type;
}