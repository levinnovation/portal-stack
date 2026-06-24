/**
 * Email service — wraps payload.sendEmail with tenant-aware defaults.
 *
 * ponytail: the templates live in ./templates.ts. This file is just glue:
 * load the tenant theme once, expose typed helpers, and pre-fill
 * fromName / fromAddress. No new abstractions, no new state.
 */
import "server-only";
import { getPayloadClient } from "@/lib/payload";
import { getTenant } from "@/lib/tenant";
import {
  renderDistributionReceived,
  renderNewDocument,
  renderPaymentDue,
  type EmailBrand,
  type DistributionReceivedProps,
  type NewDocumentProps,
  type PaymentDueProps,
} from "./templates";

export interface EmailContext {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer | string; contentType?: string }[];
}

export async function sendEmail(ctx: EmailContext) {
  const payload = await getPayloadClient();
  const tenant = await getTenant();
  return payload.sendEmail({
    to: ctx.to,
    subject: ctx.subject,
    html: ctx.html,
    text: ctx.text,
    replyTo: ctx.replyTo,
    attachments: ctx.attachments as any,
    from: tenant.description ? `${tenant.name} <${process.env.EMAIL_FROM || "no-reply@portal.local"}>` : undefined,
  });
}

async function brandFromTenant(): Promise<EmailBrand> {
  const tenant = await getTenant();
  return {
    brand: tenant.theme.brand,
    colors: {
      ...tenant.theme.colors,
      card: tenant.theme.colors.background,
      mutedForeground: tenant.theme.colors.foreground,
    },
    fonts: tenant.theme.fonts,
    radius: tenant.theme.radius,
  };
}

export async function sendPaymentDue(to: string, props: PaymentDueProps) {
  const brand = await brandFromTenant();
  return sendEmail({
    to,
    subject: `Pago próximo — ${brand.brand}`,
    html: renderPaymentDue(brand, props),
  });
}

export async function sendDistributionReceived(to: string, props: DistributionReceivedProps) {
  const brand = await brandFromTenant();
  return sendEmail({
    to,
    subject: `Distribución recibida — ${brand.brand}`,
    html: renderDistributionReceived(brand, props),
  });
}

export async function sendNewDocument(to: string, props: NewDocumentProps) {
  const brand = await brandFromTenant();
  return sendEmail({
    to,
    subject: `Nuevo documento: ${props.documentName}`,
    html: renderNewDocument(brand, props),
  });
}
