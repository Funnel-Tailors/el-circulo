import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DISPOSABLE_EMAIL_DOMAINS = [
  'temp-mail.org', '10minutemail.com', 'guerrillamail.com',
  'mailinator.com', 'throwaway.email', 'yopmail.com',
  'tempmail.com', 'fakeinbox.com', 'trashmail.com',
  'getnada.com', 'mohmal.com', 'throwawaymail.com'
];

const SPAM_EMAIL_PATTERN = /^(test|admin|fake|spam|no|none)@(test|admin|fake|spam|example)\./i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LEAD_MAGNET_TAGS = ['lead magnet', 'oferta'];
const LEAD_MAGNET_SOURCE = 'Lead Magnet Popup - Home';

interface LeadMagnetSubmission {
  email: string;
  fbclid?: string;
  sessionId?: string;
  utm?: Record<string, string>;
  referrer?: string;
}

function isInvalidEmail(email: string): { invalid: boolean; reason?: string } {
  const lower = email.toLowerCase().trim();
  if (!EMAIL_REGEX.test(lower)) return { invalid: true, reason: 'Email format invalid' };
  if (SPAM_EMAIL_PATTERN.test(lower)) return { invalid: true, reason: 'Spam pattern in email' };
  const domain = lower.split('@')[1];
  if (DISPOSABLE_EMAIL_DOMAINS.includes(domain)) return { invalid: true, reason: 'Disposable email domain' };
  return { invalid: false };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as LeadMagnetSubmission;
    const { email, fbclid, sessionId, utm, referrer } = body;

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Email is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const validation = isInvalidEmail(email);
    if (validation.invalid) {
      console.log('Invalid email rejected:', validation.reason);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const GHL_API_TOKEN = Deno.env.get('GHL_API_TOKEN');
    const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID');

    if (!GHL_API_TOKEN || !GHL_LOCATION_ID) {
      throw new Error('Missing GHL credentials');
    }

    const ghlHeaders = {
      'Authorization': `Bearer ${GHL_API_TOKEN}`,
      'Version': '2021-07-28',
      'Content-Type': 'application/json'
    };

    const cleanEmail = email.trim().toLowerCase();

    let contactId: string | null = null;
    const searchUrl = `https://services.leadconnectorhq.com/contacts/search?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(cleanEmail)}`;
    const searchResponse = await fetch(searchUrl, { method: 'GET', headers: ghlHeaders });
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      if (searchData.contacts && searchData.contacts.length > 0) {
        contactId = searchData.contacts[0].id;
      }
    }

    const customFields = [
      { key: 'circulo_fbclid', field_value: fbclid || 'organic' },
    ];

    const contactPayload: Record<string, unknown> = {
      email: cleanEmail,
      locationId: GHL_LOCATION_ID,
      tags: LEAD_MAGNET_TAGS,
      source: LEAD_MAGNET_SOURCE,
      customFields,
    };

    if (utm?.utm_source) contactPayload.attributionSource = {
      url: referrer || '',
      campaign: utm.utm_campaign || '',
      utmSource: utm.utm_source,
      utmMedium: utm.utm_medium || '',
      utmContent: utm.utm_content || '',
      utmTerm: utm.utm_term || '',
      sessionSource: utm.utm_source,
    };

    let ghlResponse: Response;
    if (contactId) {
      const { locationId: _l, ...updatePayload } = contactPayload as { locationId?: string };
      const updateUrl = `https://services.leadconnectorhq.com/contacts/${contactId}`;
      ghlResponse = await fetch(updateUrl, {
        method: 'PUT',
        headers: ghlHeaders,
        body: JSON.stringify(updatePayload),
      });
    } else {
      ghlResponse = await fetch('https://services.leadconnectorhq.com/contacts/', {
        method: 'POST',
        headers: ghlHeaders,
        body: JSON.stringify(contactPayload),
      });
    }

    if (!ghlResponse.ok) {
      const errorText = await ghlResponse.text();
      let errorData: { meta?: { contactId?: string }; message?: string } | null = null;
      try { errorData = JSON.parse(errorText); } catch (_) { /* ignore */ }

      if (
        ghlResponse.status === 400 &&
        errorData?.meta?.contactId &&
        errorData.message?.includes('duplicated contacts')
      ) {
        const dupId = errorData.meta.contactId;
        const { locationId: _l, ...updatePayload } = contactPayload as { locationId?: string };
        const updateUrl = `https://services.leadconnectorhq.com/contacts/${dupId}`;
        const updateResponse = await fetch(updateUrl, {
          method: 'PUT',
          headers: ghlHeaders,
          body: JSON.stringify(updatePayload),
        });

        if (!updateResponse.ok) {
          const updateError = await updateResponse.text();
          throw new Error(`Failed to update duplicate contact: ${updateResponse.status} - ${updateError}`);
        }

        console.log('✅ Lead magnet duplicate resolved:', { contactId: dupId, sessionId });
        return new Response(
          JSON.stringify({ success: true, contactId: dupId }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      throw new Error(`GHL API failed: ${ghlResponse.status} - ${errorText}`);
    }

    const ghlData = await ghlResponse.json();
    const finalContactId = ghlData.contact?.id || contactId;

    console.log('✅ Lead magnet submitted:', {
      contactId: finalContactId,
      operation: contactId ? 'UPDATE' : 'CREATE',
      sessionId,
    });

    return new Response(
      JSON.stringify({ success: true, contactId: finalContactId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('❌ Lead magnet error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
