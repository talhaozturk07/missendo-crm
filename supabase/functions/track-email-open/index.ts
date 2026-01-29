import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

// 1x1 transparent GIF
const TRACKING_PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 
  0x01, 0x00, 0x3b
]);

serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const recipientId = url.searchParams.get("rid");

    if (!recipientId) {
      console.log("No recipient ID provided");
      return new Response(TRACKING_PIXEL, {
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Tracking email open for recipient: ${recipientId}`);

    // Update the recipient's opened_at timestamp if not already set
    const { data: recipient, error: fetchError } = await supabase
      .from("campaign_recipients")
      .select("id, campaign_id, opened_at")
      .eq("id", recipientId)
      .single();

    if (fetchError) {
      console.error("Error fetching recipient:", fetchError);
    } else if (recipient && !recipient.opened_at) {
      // Update recipient opened_at
      const { error: updateError } = await supabase
        .from("campaign_recipients")
        .update({ opened_at: new Date().toISOString() })
        .eq("id", recipientId);

      if (updateError) {
        console.error("Error updating recipient:", updateError);
      } else {
        console.log(`Marked recipient ${recipientId} as opened`);

        // Update campaign opened_count
        const { data: stats } = await supabase
          .from("campaign_recipients")
          .select("id")
          .eq("campaign_id", recipient.campaign_id)
          .not("opened_at", "is", null);

        if (stats) {
          await supabase
            .from("email_campaigns")
            .update({ opened_count: stats.length })
            .eq("id", recipient.campaign_id);
          
          console.log(`Updated campaign ${recipient.campaign_id} opened_count to ${stats.length}`);
        }
      }
    } else if (recipient && recipient.opened_at) {
      console.log(`Recipient ${recipientId} already marked as opened`);
    }

    // Always return the tracking pixel
    return new Response(TRACKING_PIXEL, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    });

  } catch (error: any) {
    console.error("Error in track-email-open function:", error);
    // Still return the pixel even on error
    return new Response(TRACKING_PIXEL, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  }
});
