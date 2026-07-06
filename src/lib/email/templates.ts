/**
 * Email templates.
 *
 * ponytail: plain HTML strings with inline CSS. Resend and the rest of
 * the email-client world render inline styles reliably; adding react-email
 * (10+ MB of deps) for 4 templates is the rung above what we need.
 *
 * Each template returns a full <html> document. Brand colors come from
 * the active tenant so a customer's white-label email reflects their
 * portal theme.
 */
import type { TenantTheme } from "@/lib/tenant";

export type EmailBrand = {
  brand: string;
  colors: TenantTheme["colors"] & { card?: string; mutedForeground: string };
  fonts: TenantTheme["fonts"];
  radius: string;
};

function cardColor(colors: EmailBrand["colors"]): string {
  return colors.card ?? colors.background;
}

function shell(brand: EmailBrand, title: string, body: string): string {
  const { colors, fonts, radius } = brand;
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;background:${cssBg(colors.background)};font-family:${fonts.sans};color:${cssBg(colors.foreground)}">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${cssBg(colors.background)};padding:32px 16px">
      <tr><td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:${cssBg(cardColor(colors))};border-radius:${radius};border:1px solid ${cssBg(colors.border)};overflow:hidden">
          <tr><td style="background:${cssBg(colors.primary)};color:${cssBg(colors.primaryForeground)};padding:24px 32px;font-family:${fonts.display};font-size:20px">
            ${brand.brand}
          </td></tr>
          <tr><td style="padding:32px;font-size:15px;line-height:1.5">${body}</td></tr>
          <tr><td style="padding:16px 32px;border-top:1px solid ${cssBg(colors.border)};font-size:12px;color:${cssBg(colors.mutedForeground)}">
            ${brand.brand} · Email automático, no responder.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function cssBg(hsl: string | undefined): string {
  if (!hsl) return "transparent";
  return hsl.includes(" ") && !hsl.startsWith("hsl") ? `hsl(${hsl})` : hsl;
}

function ctaButton(brand: EmailBrand, label: string, href: string) {
  return `<a href="${href}" style="display:inline-block;background:${cssBg(brand.colors.accent)};color:${cssBg(brand.colors.accentForeground)};text-decoration:none;padding:12px 24px;border-radius:${brand.radius};font-weight:600;margin-top:16px">${label}</a>`;
}

export interface PaymentDueProps {
  fullName: string;
  amount: number;
  currency: "USD" | "COP";
  dueDate: string;
  unitLabel: string;
  payUrl: string;
}

export function renderPaymentDue(brand: EmailBrand, p: PaymentDueProps): string {
  const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: p.currency, maximumFractionDigits: 0 });
  const body = `
    <p style="margin:0 0 12px">Hola, <strong>${p.fullName}</strong>.</p>
    <p style="margin:0 0 12px">Tienes un pago próximo para tu unidad <strong>${p.unitLabel}</strong>:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;width:100%">
      <tr><td style="padding:8px 0;color:${cssBg(brand.colors.mutedForeground)};font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Monto</td></tr>
      <tr><td style="font-size:28px;font-weight:700;padding:0 0 8px">${fmt.format(p.amount)}</td></tr>
      <tr><td style="padding:8px 0;color:${cssBg(brand.colors.mutedForeground)};font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Vence</td></tr>
      <tr><td style="font-size:18px;font-weight:600;padding:0 0 8px">${p.dueDate}</td></tr>
    </table>
    ${ctaButton(brand, "Pagar ahora", p.payUrl)}
    <p style="margin:24px 0 0;color:${cssBg(brand.colors.mutedForeground)};font-size:13px">Si ya realizaste el pago, ignora este mensaje.</p>
  `;
  return shell(brand, `Pago próximo — ${brand.brand}`, body);
}

export interface DistributionReceivedProps {
  fullName: string;
  amount: number;
  currency: "USD" | "COP";
  distributionDate: string;
  projectName: string;
  portfolioUrl: string;
}

export function renderDistributionReceived(brand: EmailBrand, p: DistributionReceivedProps): string {
  const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: p.currency, maximumFractionDigits: 0 });
  const body = `
    <p style="margin:0 0 12px">Hola, <strong>${p.fullName}</strong>.</p>
    <p style="margin:0 0 12px">Has recibido una distribución de tu inversión en <strong>${p.projectName}</strong>:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;width:100%">
      <tr><td style="padding:8px 0;color:${cssBg(brand.colors.mutedForeground)};font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Monto</td></tr>
      <tr><td style="font-size:28px;font-weight:700;color:${cssBg(brand.colors.accent)};padding:0 0 8px">+${fmt.format(p.amount)}</td></tr>
      <tr><td style="padding:8px 0;color:${cssBg(brand.colors.mutedForeground)};font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Fecha</td></tr>
      <tr><td style="font-size:16px;padding:0 0 8px">${p.distributionDate}</td></tr>
    </table>
    ${ctaButton(brand, "Ver portafolio", p.portfolioUrl)}
  `;
  return shell(brand, `Distribución recibida — ${brand.brand}`, body);
}

export interface NewDocumentProps {
  fullName: string;
  documentName: string;
  documentType: string;
  downloadUrl: string;
  uploaderName: string;
}

export function renderNewDocument(brand: EmailBrand, p: NewDocumentProps): string {
  const body = `
    <p style="margin:0 0 12px">Hola, <strong>${p.fullName}</strong>.</p>
    <p style="margin:0 0 12px"><strong>${p.uploaderName}</strong> subió un nuevo documento a tu portal:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;width:100%">
      <tr><td style="padding:8px 0;color:${cssBg(brand.colors.mutedForeground)};font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Documento</td></tr>
      <tr><td style="font-size:18px;font-weight:600;padding:0 0 8px">${p.documentName}</td></tr>
      <tr><td style="padding:8px 0;color:${cssBg(brand.colors.mutedForeground)};font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Tipo</td></tr>
      <tr><td style="font-size:14px;padding:0 0 8px">${p.documentType}</td></tr>
    </table>
    ${ctaButton(brand, "Ver documento", p.downloadUrl)}
  `;
  return shell(brand, `Nuevo documento — ${brand.brand}`, body);
}
