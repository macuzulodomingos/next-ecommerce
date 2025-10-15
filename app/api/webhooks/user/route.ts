import prisma from "@/lib/prisma";
import { IncomingHttpHeaders } from "http";
import { Webhook, WebhookRequiredHeaders } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || "";

type EventType = "user.created" | "user.updated" | "+";

type Event = {
    data: EventDataType;
    object: 'event';
    type: EventType;
};

type EventDataType = {
    id: string;
    first_name: string;
    last_name: string;
    email_addresses: EmailAddressType[];
    primary_email_address_id: string;
    attributes: Record<string, string | number>;
};

type EmailAddressType = {
    id: string;
    email_address: string;
};

async function handler(request: Request) {
    const payload = await request.json();
    const headersList = headers();
    const heads = {
        "svix_id": headersList.get("svix-id"),
        "svix_timestamp": headersList.get("svix-timestamp"),
        "svix_signature": headersList.get("svix-signature"),
    };
    const wh = new webhook(webhookSecret);
    let evt: Event | null = null;

    try {
        evt = wh.verify(
            JSON.stringify(payload),
            heads as IncomingHttpHeaders & WebhookRequiredHeaders
        ) as Event;
    } catch (err) {
        console.error((err as Error).message);
        return NextResponse.json({}, { status: 400 });
    }
}

export const Get = handler;
export const Post = handler;
export const Put = handler;