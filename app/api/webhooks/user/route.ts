import prisma from "@/lib/prisma";
import { IncomingHttpHeaders } from "http";
import { Webhook, WebhookRequiredHeaders } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || "";

type EventType = "user.created" | "user.updated" | "user.deleted";

type Event = {
  data: EventDataType;
  object: "event";
  type: EventType;
};

type EventDataType = {
  id: string;
  first_name: string;
  last_name: string;
  email_addresses: EmailAddressType[];
  primary_email_address_id: string;
  attributes?: Record<string, string | number>;
};

type EmailAddressType = {
  id: string;
  email_address: string;
};

async function handler(request: Request) {
  const payload = await request.json();
  const headersList = headers();

  const heads = {
    "svix-id": headersList.get("svix-id"),
    "svix-timestamp": headersList.get("svix-timestamp"),
    "svix-signature": headersList.get("svix-signature"),
  };

  const wh = new Webhook(webhookSecret);
  let evt: Event | null = null;

  try {
    evt = wh.verify(
      JSON.stringify(payload),
      heads as IncomingHttpHeaders & WebhookRequiredHeaders
    ) as Event;
  } catch (err) {
    console.error("❌ Erro ao verificar webhook:", (err as Error).message);
    return NextResponse.json({}, { status: 400 });
  }

  const eventType: EventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const {
      id,
      first_name,
      last_name,
      email_addresses,
      primary_email_address_id,
      attributes = {},
    } = evt.data;

    const email =
      email_addresses.find((e) => e.id === primary_email_address_id)
        ?.email_address || "";

    await prisma.user.upsert({
      where: { externalId: id },
      create: {
        externalId: id,
        firstName: first_name,
        lastName: last_name,
        email,
        attributes,
      },
      update: {
        firstName: first_name,
        lastName: last_name,
        email,
        attributes,
      },
    });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
